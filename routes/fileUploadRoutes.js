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

const readWriteFile = (fileName, encodedString, type) => {
    fileName = fileName.slice(0,fileName.length-3);
    let writeStream = fs.createWriteStream(`./public/uploads/${fileName}${type}`);
    writeStream.write(encodedString);  
    let stats = fs.statSync(`./public/uploads/${fileName}${type}`) ;
    console.log(stats);
    // let fileSizeInBytes = stats.size;
    let fileSizeInBytes = 0;
    return fileSizeInBytes;
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

    const huffmanObj = new Huffman();
    let [encodedHuffmanString, outputMsg] = huffmanObj.encode(data);
    let huffSize = readWriteFile(req.file.filename, encodedHuffmanString, 'huff');

    const lzwObj = new Lzw();
    let encodedLzwString = lzwObj.encode(data);
    let lzwSize = readWriteFile(req.file.filename,encodedLzwString,"lzw");

    let encodedLz77String = Lz77.compress(data);
    let lz77Size = readWriteFile(req.file.filename,encodedLz77String,"lz77");

    res.send(`huffSize = ${huffSize}, lzwSize = ${lzwSize}, lz77Size = ${lz77Size}`);

});

module.exports = router;
