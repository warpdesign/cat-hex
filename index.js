#!/usr/bin/env node
const program = require('commander'),
    fs = require('fs'),
    LINE_WIDTH = 192 / 8,
    BUFFER_LENGTH = 64 * 1024;

class HexaFile {
    constructor(path, blockSize, startOffset, hexa, offset) {
        this.err = '';
        this.path = path;
        this.currentOffset = parseInt(startOffset);
        this.buffer = null;
        this.blockSize = parseInt(blockSize);
        this.startOffset = parseInt(startOffset);
        this.showOffset = offset;
        this.showHexa = hexa;
    }

    statFile() {
        this.fstat = fs.statSync(this.path);
    }

    openFile() {
        console.log('Reading file %s', this.path);
        this.statFile(this.path);
        this.fd = fs.openSync(this.path, 'r');
        this.buffer = new Buffer(BUFFER_LENGTH);
        this.readNextChunk();
    }

    readNextChunk() {
        // for now read everything
        fs.readSync(this.fd, this.buffer, 0, BUFFER_LENGTH, this.currentOffset);
        // console.log(this.buffer[0], this.buffer[1]);
        // console.log(this.buffer[0]);
    }

    cleanup() {
        if (this.fd) {
            fs.closeSync(this.fd);
        }
    }

    print() {
        const max = Math.ceil(this.fstat.size / LINE_WIDTH);
        // console.log('lines', max);

        for (var i = 0; i < max; ++i) {
            var line = '';
            if (this.showOffset) {
                line += this.getOffset();
                line += '   ';
            }

            if (this.showHexa) {
                line += this.getHexaBlock();
                line += '   ';
            }

            line += this.getAsciiBlock();

            this.currentOffset += LINE_WIDTH;
            console.log(line);
        }
    }

    getOffset() {
        return this.converOffsetTotHexa(this.currentOffset);
    }

    getHexaBlock() {
        // console.log('getblock', this.currentOffset, 'blockSize', this.blockSize, LINE_WIDTH);
        var str = '',
            pos = 0,
            spacing = this.blockSize / 8;

        while (pos < LINE_WIDTH) {
            // console.log('pos', pos);
            // console.log('reading index', this.currentOffset + pos, this.readNextAscii(this.currentOffset + pos));
            str += this.readNextByte(this.currentOffset + pos);

            pos++;
            if (pos && !(pos % spacing)) {
                str += '  ';
            }
        }
        return str;
    }

    getAsciiBlock() {
        var str = '',
            pos = 0;

        while (pos < LINE_WIDTH) {
            // console.log('pos', pos);
            // console.log('reading index', this.currentOffset + pos, this.buffer[this.currentOffset + pos]);
            str += this.readNextAscii(this.currentOffset + pos);

            pos++;
        }
        return str;
    }

    readNextByte(offset) {
        if (offset < this.fstat.size) {
            return this.converByteTotHexa(this.buffer[offset]);
        } else {
            return '..';
        }
    }

    readNextAscii(offset) {
        if (offset < this.fstat.size) {
            var code = this.buffer[offset];
            if (code > 32 && code < 127) {
                return String.fromCharCode(code);
            }
        }

        return '.';
    }

    converOffsetTotHexa(number) {
        return ("00000000" + number.toString(16)).substr(-8);
    }

    converByteTotHexa(number) {
        return ("00" + number.toString(16)).substr(-2);
    }
}

program.arguments('ch <file>')
    .option('-O, --no-offset', 'do not show file offset', false)
    .option('-H, --no-hexa', 'do not display hexadecimal content', false)
    .option('-s, --start-offset [startOffset]', 'start at specified offset', 0)
    .option('-b, --block-size [blockSize]', 'size of block, can be 8, 16, 32, 64', 8)
    .parse(process.argv);

if (!program.args.length) {
    program.help();
} else {
    const path = program.args[0];

    try {
        var hexa = new HexaFile(path, program.blockSize, program.startOffset, program.hexa, program.offset);
        hexa.openFile();
        hexa.print();
        hexa.cleanup();
    } catch (err) {
        hexa.cleanup();
        console.log('%s\n', err);
    }
}