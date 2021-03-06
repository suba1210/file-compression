const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { performance } = require('perf_hooks');
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
    let size = waitAndGetSize(filePath);
    resolve(size);
  })

};

const readWriteFileDecode = (fileName, decodedString,type) => {
  let filePath;
  if(type == "huff")
  {
    filePath = `./public/uploads/${fileName.slice(0, fileName.length - 4)}txt`;
  }
  else if(type == "lz77")
  {
    filePath = `./public/uploads/${fileName.slice(0, fileName.length - 4)}txt`;
  }
  else if(type == "lzw")
  {
    filePath = `./public/uploads/${fileName.slice(0, fileName.length - 3)}txt`;
  }
  fs.writeFileSync(filePath, decodedString);
  return filePath;
};


router.get("/home", async (req, res) => {
  res.render("homePage");
});

router.post("/encodeData", upload.single("file"), async (req, res) => {
  //chek txt
  //check size
  try{
    let fileSize = await waitAndGetSize(`./public/uploads/${req.file.filename}`);
    const data = fs.readFileSync(`./public/uploads/${req.file.filename}`, {
      encoding: "utf8",
      flag: "r",
    });
    let nameSplit = req.file.filename.split('.');
		var extension = nameSplit[nameSplit.length - 1].toLowerCase();
		if (extension != "txt" ) {
		  req.flash("success_msg","Please upload only text files!");
      res.redirect('/home');
		}
    else if(!data ||data == null || data == undefined)
    {
      req.flash("success_msg", "Empty file cannot be encoded!");
      res.redirect('/home');
    }
    else if(fileSize < 1000)
    {
      req.flash("success_msg", "The uploaded file is very small in size. The compressed file might be larger in size than the uncompressed file (compression ratio might be smaller than one). Better compression ratios are achieved for larger file sizes!");
      res.redirect('/home');
    }
    else{
    let huffSize,lzwSize,lz77Size;
  
    const huffmanObj = new Huffman();
    let startTime = performance.now()
    let [encodedHuffmanString, outputMsg] = huffmanObj.encode(data);
    let endTime = performance.now()
    huffSize = await readWriteFile(req.file.filename, encodedHuffmanString, "huff");
    let huffTime = (endTime - startTime).toFixed(2);
  
    const lzwObj = new Lzw();
    startTime = performance.now()
    let encodedLzwString = lzwObj.encode(data);
    endTime = performance.now()
    lzwSize = await readWriteFile(req.file.filename, encodedLzwString, "lzw");
    let lzwTime = (endTime - startTime).toFixed(2);
  
    startTime = performance.now()
    let encodedLz77String = Lz77.compress(data);
    endTime = performance.now()
    lz77Size = await readWriteFile(req.file.filename, encodedLz77String, "lz77");
    let lz77Time = (endTime - startTime).toFixed(2);


    let fileName = req.file.filename;
    fileName = fileName.slice(0, fileName.length - 4)

    res.render('comparePage',{fileSize,huffSize,lzwSize,lz77Size,huffTime,lzwTime,lz77Time,fileName});

    }
  }
  catch(error)
  {
    console.log(error);
  }
  
});

router.get("/download/:fileName",async(req,res)=>{
  try{
    let filePath = `./public/uploads/${req.params.fileName}`
    res.download(filePath);
  }catch(error){
    console.log(error);
  }
})

router.post("/decodeData", upload.single("file"), async (req, res) => {
  try{
    const data = fs.readFileSync(`./public/uploads/${req.file.filename}`, {
      encoding: "utf8",
      flag: "r",
    });
    if(!data ||data == null || data == undefined)
    {
      req.flash("success_msg", "Empty file cannot be decoded!");
      res.redirect('/home');
    }
    const {algos} = req.body;
    let nameSplit = req.file.filename.split('.');
    var extension = nameSplit[nameSplit.length - 1].toLowerCase();
    if ((extension != "huff" && algos == "huffman" ) ||
    (extension != "lzw" && algos == "lzw" )||
    (extension != "lz77" && algos == "lz77" )) {
      req.flash("success_msg",`Please upload ${algos} encoded file!`);
      res.redirect('/home');
    }
    let fileSize = await waitAndGetSize(`./public/uploads/${req.file.filename}`);
    if(fileSize < 1000)
    {
      req.flash("success_msg", "The uploaded file is very small in size. The compressed file might be larger in size than the uncompressed file (compression ratio might be smaller than one). Better compression ratios are achieved for larger file sizes!");
      res.redirect('/home');
    }
    if(algos === "huffman"){
      const huffmanObj = new Huffman();
      let [decodedHuffmanString, outputMsg] = huffmanObj.decode(data);
      let filePath = readWriteFileDecode(req.file.filename, decodedHuffmanString,"huff");
      res.download(filePath);
    }else if(algos === "lzw"){
      const lzwObj = new Lzw();
      let decodedLzwString = lzwObj.decode(data);
      let filePath = readWriteFileDecode(req.file.filename, decodedLzwString,"lzw");
      res.download(filePath);
    }else if(algos === "lz77"){
      let decodedLz77String = Lz77.decompress(data);
      let filePath = readWriteFileDecode(req.file.filename, decodedLz77String,"lz77");
      res.download(filePath);
    }
  }catch(error)
  {
    console.log(error);
  }

})

module.exports = router;