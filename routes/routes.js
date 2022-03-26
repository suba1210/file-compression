const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Huffman = require("../algorithms/huffman/huffman");
const Lzw = require("../algorithms/lzw/lzw");
const Lz77 = require("lzbase62");

//file upload
const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage
});

const waitAndGetSize = async(fileName1) => {
    let sizeInBytes;
    return await new Promise(resolve => {
      const interval = setInterval(() => {
        if (fs.existsSync(fileName1) && fs.statSync(fileName1).size !== 0) {
          clearInterval(interval);
          sizeInBytes = fs.statSync(fileName1).size;
          resolve(sizeInBytes);
        };
      }, 1000);
    });
    
}

const readWriteFile = async(fileName, encodedString, type) => {
  return await new Promise(resolve => {
    let filePath = `./public/uploads/${fileName.slice(0, fileName.length - 4)}.${type}`;
    let writeStream = fs.createWriteStream(filePath);
    writeStream.write(encodedString);
    let size = waitAndGetSize(filePath, type);
    resolve(size);
  })

};

const readWriteFileDecode = (fileName, decodedString) => {
  let filePath = `./public/uploads/${fileName.slice(0, fileName.length - 4)}.txt`;
  fs.writeFileSync(filePath, decodedString);
  return filePath;
};


router.get("/home", async (req, res) => {
  res.render("homePage");
});

router.post("/encodeData", upload.single("file"), async (req, res) => {
  const data = fs.readFileSync(`./public/uploads/${req.file.filename}`, {
    encoding: "utf8",
    flag: "r",
  });
  let huffSize,lzwSize,lz77Size;

  const huffmanObj = new Huffman();
  let [encodedHuffmanString, outputMsg] = huffmanObj.encode(data);
  huffSize = await readWriteFile(req.file.filename, encodedHuffmanString, "huff");

  const lzwObj = new Lzw();
  let encodedLzwString = lzwObj.encode(data);
  lzwSize = await readWriteFile(req.file.filename, encodedLzwString, "lzw");

  let encodedLz77String = Lz77.compress(data);
  lz77Size = await readWriteFile(req.file.filename, encodedLz77String, "lz77");

  res.send('huff size: ' + huffSize + ' lzw size: ' + lzwSize + ' lz77 size: ' + lz77Size);

});


router.post("/decodeData", upload.single("file"), async (req, res) => {
  const data = fs.readFileSync(`./public/uploads/${req.file.filename}`, {
    encoding: "utf8",
    flag: "r",
  });
  const {algos} = req.body;

  if(algos === "huffman"){
    const huffmanObj = new Huffman();
    let [decodedHuffmanString, outputMsg] = huffmanObj.decode(data);
    let filePath = readWriteFileDecode(req.file.filename, decodedHuffmanString);
    res.download(filePath);
  }else if(algos === "lzw"){
    const lzwObj = new Lzw();
    let decodedLzwString = lzwObj.decode(data);
    let filePath = readWriteFileDecode(req.file.filename, decodedLzwString);
    res.download(filePath);
  }else if(algos === "lz77"){
    let decodedLz77String = Lz77.decompress(data);
    let filePath = readWriteFileDecode(req.file.filename, decodedLz77String);
    res.download(filePath);
  }
})

module.exports = router;