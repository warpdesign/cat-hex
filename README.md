# ch
cat content of binary files - the cat of hexadecimal

# Installation
> npm install -g cat-hex

This will install a new `ch` command.

# Usage

```
  Usage: ch [options] <file>

  Options:

    -O, --no-offset                   do not show file offset
    -H, --no-hexa                     do not display hexadecimal content
    -s, --start-offset [startOffset]  start at specified offset (default: 0)
    -b, --block-size [blockSize]      size of block, can be 8, 16, 32, 64 (default: 8)
    -h, --help                        output usage information
```

# Example

Reads `file.zip` with 32 bytes blocksize:

```bash
$ ch -b 32 ./file.zip
00000000   504b0304  14000000  000093b8  2a4a0000  00000000  00000000  PK..........*J..........
00000018   00000900  0000416d  6269616e  63652f50  4b030414  00000000  ......Ambiance/PK.......
00000030   0093b82a  4a000000  00000000  00000000  000a0000  00416d62  ...*J................Amb
00000048   69616e63  65332f50  4b030414  00000008  00ba024e  33e6233a  iance3/PK..........N3.#:
00000060   a3e77c48  00825749  00140000  00416d62  69616e63  65332f46  ..|H..WI.....Ambiance3/F
00000078   6f726573  742e6d70  33245a75  58935f1b  7e17202d  31e24739  orest.mp3$ZuX._.~. -1.G9
00000090   3aa4414a  d0d18c92  464a4905  69105140  193d4677  77232229  :.AJ....FJI.i.Q@.=Fww#")
000000a8   824a4977  49084a77  a9804abe  dff07bfe  d9ae5dd7  ce799e73  .JIwI.Jw..J...{...]..y.s
000000c0   3f799f03  9ec6a118  10c09568  12fcfb20  b6ca0300  72f94895  ?y.........h... ....r.H.
000000d8   f45b00b1  7cae4323  f7280005  306d9400  1c809289  c8114551  .[..|.C#.(..0m........EQ
```