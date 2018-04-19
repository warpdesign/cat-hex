# cat-hex
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
    -v, --version                     output the version number
    -h, --help                        output usage information
```

# Examples

Shows `file.zip` content, with `32 bytes` blocksize:

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
[...]
```

Shows `huge-file` contents, starting at offset `0x100000000` with `64 bytes` block size:

```bash
$ ch -b 64 -s 0x100000000 ./huge-file
00000001f7000000   88918796899208fb  49f97b156c26552b  4d491c09a10aaaaf  .......ûIù{.l&U+MI..¡.ª¯
00000001f7000018   aab7a6bc08e61dfb  67069eb29cb399b6  08f874fc10151c3e  ª·¦¼.æ.ûg..².³.¶.øtü...>
00000001f7000030   8e0a806d8b8c621f  908291818d8308bb  a61c58a80a13e95f  ...m..b........»¦.X¨..é_
00000001f7000048   f749f7460770646c  646f6fa47e18aeae  b2c3adbc1c5e730a  ÷I÷F.pdldoo¤~.®®²Ã­¼.^s.
00000001f7000060   fb4506848f849083  90c1a9d0b5bcb673  9c18848805fc336e  ûE.......Á©Ðµ¼¶s.....ü3n
[...]
```
