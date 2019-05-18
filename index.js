#!/usr/bin/env node
const program = require('commander'),
    version = require('./package.json').version,
    fs = require('fs'),
    process = require('process'),
    EOL = require('os').EOL,
    // 16 bytes
    DEFAULT_LINE_WIDTH = 16,
    // 512kb buffer: we could add a lot more but this will make it work better
    // on older devices like USB 1.x sticks
    BUFFER_LENGTH = 512 * 1024,
    MAX_32BIT = 0xffffffff,
    isWindows = process.platform == 'win32',
    ERROR_CODES = {
        'SIGINT': -1,
        'SIGPIPE': -1,
        'IS_A_DIRECTORY': 1,
        'ENOENT': 2
    },
    ERROR_MESSAGES = {
        '2': 'No such file or directory',
        '1': 'Is a directory'
    } 

class HexaFile {
    constructor(path, blockSize, startOffset, hexa, offset, lineWidth, maxOffset) {
        this.stopped = false;
        this.path = path;
        this.currentOffset = parseInt(startOffset);
        this.buffer = null;
        this.blockSize = parseInt(blockSize);
        this.bufferStart = this.currentOffset;
        this.showOffset = offset;
        this.showHexa = hexa;
        this.lineWidth = parseInt(lineWidth);
        this.maxOffset = parseInt(maxOffset);
        this.bindDrainEvent();
    }

    bindDrainEvent() {
        process.stdout.on('drain', () => {
            this.printLine();
        });
    }

    throwError(codeName) {
        const error = new Error();
        error.code = ERROR_CODES[codeName];

        throw error;        
    }

    /**
     * Returns stats of file, throwing an error
     * if path points to a directory
     */
    statFile() {
        try {
            this.fstat = fs.statSync(this.path);
        } catch (err) {
            this.throwError(err.code);
        }

        if (this.fstat && this.fstat.isDirectory()) {
            // throw "Error: ch only works on files";
            // const error = new Error();
            // error.code = ERROR_CODES['IS_A_DIRECTORY'];
            // throw error;
            this.throwError('IS_A_DIRECTORY');            
        }

        // if (this.fstat && !this.fstat.size) {
        //     console.log(this.fstat);
        //     throw "Empty file";
        // }
    }

    /**
     * Attempts to open file for reading and reads the first
     * chunk into buffer
     * 
     * Note: if startOffset is beyond file, it will be reset to 0
     */
    openFile() {
        this.statFile(this.path);
        this.checkStartOffset();
        this.getMaxOffset();
        this.fd = fs.openSync(this.path, 'r');
        this.buffer = Buffer.alloc(BUFFER_LENGTH);
        this.readChunk(this.currentOffset);
    }

    /**
     * Calculates the max offset
     */
    getMaxOffset() {
        const maxOffset = this.currentOffset + this.maxOffset;

        if (this.maxOffset === 0) {
            this.maxOffset = this.fstat.size - this.currentOffset;
        } else if (maxOffset > this.fstat.size) {
            this.maxOffset = this.fstat.size;
        } else {
            this.maxOffset = maxOffset;
        }
    }

    /**
     * Checks that start offset is within file otherwise
     * reset it to 0
     */
    checkStartOffset() {
        if (this.currentOffset >= this.fstat.size) {
            console.log('Warning: specified start offset is out of bounds, using default start offset of 0');
            this.currentOffset = 0;
            this.bufferStart = 0;
        }
    }

    /**
     * Reads (up to) BUFFER_LENGTH bytes from the file into the buffer
     * 
     * @param {number} offset the offset to starting reading
     */
    readChunk(offset) {
        fs.readSync(this.fd, this.buffer, 0, BUFFER_LENGTH, offset);
    }

    printError(code) {
        const message = ERROR_MESSAGES[code];
        console.log(`${program._name}: ${this.path}: ${message}`);
    }

    /**
     * Closes the file if opened
     */
    cleanup(code) {
        if (code === ERROR_CODES['SIGINT']) {
            console.log('*** Interrupted');
        }

        this.stopped = true;
        if (this.fd) {
            fs.closeSync(this.fd);
        }

        this.printError(code);
    }

    /**
     * Prints current line, incrementing the line counter
     */
    printLine() {
        if (!this.stopped && this.currentLine < this.maxLine) {
            var line = '';
            var isBufferFull;

            if (this.showOffset) {
                line += this.getOffset();
                line += '   ';
            }

            line += this.generateLine();

            this.currentOffset += this.lineWidth;
            isBufferFull = !process.stdout.write(line);
            // console.log(line);

            this.currentLine++;

            // use setImmediate instead of a simple for() loop
            // so that we may handle SIGPIPE signal
            // TODO: stop calling setImediate if not needed
            if (!isBufferFull) {
                setImmediate(() => { this.printLine(); });
            }
        }
    }

    /**
     * Prints hexa dump of the specified file using specified params
     */
    print() {
        this.maxLine = Math.ceil(this.maxOffset / this.lineWidth);
        this.currentLine = 0;
        this.printLine();
    }

    /**
     * Gets current file offset in hexa decimal
     */
    getOffset() {
        return this.convertOffsetTotHexa(this.currentOffset);
    }

    /**
     * Returns hexa + ascii content of current line
     */
    generateLine() {
        var hexa = '',
            ascii = '',
            pos = 0,
            spacing = this.blockSize / 8;

        while (pos < this.lineWidth && ((this.currentOffset + pos) < this.maxOffset)) {
            hexa += this.getByteHexa(this.currentOffset + pos);
            ascii += this.getAscii(this.currentOffset + pos);
            pos++;

            if (pos && !(pos % spacing)) {
                hexa += ' ';
            }
        }

        ascii += EOL;

        return this.showHexa ? hexa + '  ' + ascii : ascii;
    }

    /**
     * Checks that current offset is within the buffer
     * 
     * If not fill the buffer with the next chunk
     * 
     * @param {number} offset offset to check
     */
    checkBuffer(offset) {
        if (offset >= BUFFER_LENGTH + this.bufferStart) {
            this.bufferStart = offset;
            this.readChunk(offset);
        }
    }

    /**
     * Returns data from the file
     * 
     * This method simply converts the buffer offset from file offset
     * and returns buffer data
     * 
     * @param {number} offset file offset to get data from
     */
    readByteFromFile(offset) {
        if (offset < this.maxOffset) {
            this.checkBuffer(offset);
            return this.buffer[offset - this.bufferStart];
        } else {
            return -1;
        }
    }

    /**
     * Returns hexa representation of byte at position offset
     * 
     * @param {number} offset 
     * 
     * @returns {String} hexa of byte or '..' if offset is out of bounds
     */
    getByteHexa(offset) {
        var byte = this.readByteFromFile(offset);

        if (byte > -1) {
            return this.convertByteTotHexa(byte);
        } else {
            return '..';
        }
    }


    /**
     * Returns ascii character at specified position
     * 
     * @param {number} offset 
     * 
     * @returns the ascii character at specified position or '.' if it cannot be displayed
     */
    getAscii(offset) {
        var code = this.readByteFromFile(offset);
        // Most Windows command line tools (eg. more) do not properly handle utf8
        // so we do not print extended ascci chars (code > 160)
        // on this platform, this allows to use `ch foo.zip | more` safely
        // Also skip 0xAD which doesn't seem to be a valid character
        if (((!isWindows && code > 160) || (code >= 32 && code < 127)) && code !== 0xAD) {
            return String.fromCharCode(code);
        } else {
            return '.';
        }
    }

    /**
     * Convert a 64bit number into hexa decimal
     * 
     * @param {number} number the number to convert in hexa
     * @returns {String}
     */
    convertOffsetTotHexa(number) {
        if (number <= MAX_32BIT) {
            return ("00000000" + number.toString(16)).substr(-8);
        } else {
            return ("0000000000000000" + number.toString(16)).substr(-16);
        }
    }

    /**
     * Converts a byte into hexa decimal
     * 
     * @param {number} number number to convert
     * @returns {String}
     */
    convertByteTotHexa(number) {
        return ("00" + number.toString(16)).substr(-2);
    }
}

/**
 * Checks that command line params are valid
 * 
 * @param {Commander} program the commander instance
 */
function validateParams(program) {
    if (!String(program.blockSize).match(/8|16|32|64/)) {
        console.log('Error: size block can only be 8, 16, 32, 64');
        return false;
    } else if (isNaN(parseInt(program.startOffset)) || parseInt(program.startOffset) < 0) {
        console.log('Error: start offset must be > 0', program);
        return false;
    } else if (isNaN(parseInt(program.lineWidth)) || parseInt(program.lineWidth) <= 0) {
        console.log('Error: line width must be > 0', program);
    } else if (isNaN(parseInt(program.maxOffset)) || parseInt(program.maxOffset) < 0) {
        console.log('Error: max offset must be >= 0', program);
    }

    return true;
}

program.arguments('ch <file>')
    .description('Prints contents of binary files as hexadecimal & ascii.')
    .option('-b, --block-size [blockSize]', 'size of block, can be 8, 16, 32, 64', 8)
    .option('-H, --no-hexa', 'do not display hexadecimal content', false)
    .option('-l, --line-width [lineWidth]', 'line width in bytes', DEFAULT_LINE_WIDTH)
    .option('-m, --max-offset [maxOffset]', 'only show n bytes, setting to 0 means show whole file', 0)
    .option('-O, --no-offset', 'do not show file offset', false)
    .option('-s, --start-offset [startOffset]', 'start at specified offset', 0)
    .version(version, '-v, --version')
    .parse(process.argv);

/**
 * Global cleanup function called when closing pipe
 * or read error occured
 */
function cleanup(code = 0) {
    if (hexa) {
        hexa.cleanup(code);
    }

    process.exitCode = code;
}

/**
 * Unix: exit the app when receiving the SIGPIPE signal:
 * it means pipe has ended (eg. user used ch foo |more and
 * pressed `q` to exit)
 */
process.on('SIGPIPE', err => {
    cleanup(ERROR_CODES['SIGPIPE']);
});

/**
 * Detect CTRL+C and stop feeding stdout in that case
 */
process.on('SIGINT', err => {
    cleanup(ERROR_CODES['SIGINT']);
});

/**
 * Properly catch pipe exit on Windows needs a special case
 */
process.stdout.on('error', (err) => {
    if (err.code === "EPIPE") {
        cleanup(ERROR_CODES['SIGPIPE']);
    }
});

if (!program.args.length || !validateParams(program)) {
    program.help();
} else {
    const path = program.args[0];

    try {
        var hexa = new HexaFile(path, program.blockSize, program.startOffset, program.hexa, program.offset, program.lineWidth, program.maxOffset);
        hexa.openFile();
        hexa.print();
    } catch (err) {
        cleanup(err && err.code || 0);
    }
}
