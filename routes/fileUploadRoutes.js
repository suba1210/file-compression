const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Huffman = require('../algorithms/huffman/huffman');
const Lzw = require('../algorithms/lzw/lzw');
const Lz77 = require("lzbase62");

//file upload
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function(req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + 
        path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {
        checkFileType(file, callback);
    }
});

const readWriteFile = async(fileName, encodedString, type) => {
    fileName = fileName.slice(0,fileName.length-4);
    let writeStream = fs.createWriteStream(`./public/uploads/${fileName}-${type}.txt`);
    await writeStream.write(encodedString);  
    // let stats = fs.statSync(`./public/uploads/${fileName}-${type}.txt`);
    // console.log(stats);
    // let fileSizeInBytes = stats.size;
    let fileSizeInBytes = 0;
}

function checkFileType(file, callback, req, res) {
    const filetypes = [
        "text/plain"
    ];
    const mimetype = filetypes.includes(file.mimetype);

    if(mimetype) {
        return callback(null, true);
    } else {
        callback("Error: Images only!");
    }
}

router.get("/home", async (req, res) => {
  res.render("homePage");
});


router.post("/addFile", upload.single("file"), async (req, res) => {
    const data = fs.readFileSync(`./public/uploads/${req.file.filename}`,{encoding:'utf8', flag:'r'});
    let stats = fs.statSync(`./public/uploads/${req.file.filename}`);
    console.log(stats);


    const huffmanObj = new Huffman();
    let [encodedHuffmanString, outputMsg] = huffmanObj.encode(data);
    await readWriteFile(req.file.filename, encodedHuffmanString, 'huff');
    let fileName1 = req.file.filename;
    fileName1 = './public/uploads/' + fileName1.slice(0,fileName1.length-4) + '-huff.txt';
    console.log(fileName1);
    stats = fs.statSync(fileName1);
    console.log(stats);

    // const lzwObj = new Lzw();
    // let encodedLzwString = lzwObj.encode(data);
    // let lzwSize = readWriteFile(req.file.filename,encodedLzwString,"lzw");
    // let fileName2 = req.file.filename;
    // fileName2 = fileName1.slice(0,fileName2.length-4);
    // stats = fs.statSync(`./public/uploads/${fileName2}-lzw.txt`);
    // console.log(stats);

    // let encodedLz77String = Lz77.compress(data);
    // let lz77Size = readWriteFile(req.file.filename,encodedLz77String,"lz77");
    // let fileName3 = req.file.filename;
    // fileName3 = fileName3.slice(0,fileName3.length-4);
    // stats = fs.statSync(`./public/uploads/${fileName3}-lz77.txt`);
    // console.log(stats);

    res.send(`summa`);

});

module.exports = router;
