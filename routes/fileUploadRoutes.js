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
  storage: storage,
  fileFilter: function (req, file, callback) {
    checkFileType(file, callback);
  },
});

const readWriteFile = (fileName, encodedString, type) => {
  fileName = fileName.slice(0, fileName.length - 4);
  let writeStream = fs.createWriteStream(
    `./public/uploads/${fileName}.${type}`
  );
  writeStream.write(encodedString);
  return;
};

function checkFileType(file, callback, req, res) {
  const filetypes = ["text/plain"];
  const mimetype = filetypes.includes(file.mimetype);

  if (mimetype) {
    return callback(null, true);
  } else {
    callback("Error: Images only!");
  }
}

router.get("/home", async (req, res) => {
  res.render("homePage");
});

router.post("/addFile", upload.single("file"), async (req, res) => {
  const data = fs.readFileSync(`./public/uploads/${req.file.filename}`, {
    encoding: "utf8",
    flag: "r",
  });

  const huffmanObj = new Huffman();
  let [encodedHuffmanString, outputMsg] = huffmanObj.encode(data);
  readWriteFile(req.file.filename, encodedHuffmanString, "huff");
  let fileName1 = req.file.filename;
  fileName1 =
    "./public/uploads/" + fileName1.slice(0, fileName1.length - 4) + ".huff";
  console.log(fileName1);

  let counter = 0;
  let threshold = 100;

  let interval = setInterval(() => {
    if (fs.existsSync(fileName1) && fs.statSync(fileName1).size !== 0) {
      clearInterval(interval);
      stats = fs.statSync(fileName1);
      console.log("huffStats", stats);
    } else if (counter <= threshold) {
      counter++;
    } else {
      clearInterval(interval);
      reject(new Error(`${fileName1} was not created.`));
    }
  }, 1000);

  const lzwObj = new Lzw();
  let encodedLzwString = lzwObj.encode(data);
  readWriteFile(req.file.filename, encodedLzwString, "lzw");
  let fileName2 = req.file.filename;
  fileName2 =
    "./public/uploads/" + fileName2.slice(0, fileName2.length - 4) + ".lzw";

  counter = 0;
  threshold = 100;

  interval = setInterval(() => {
    if (fs.existsSync(fileName2) && fs.statSync(fileName2).size !== 0) {
      clearInterval(interval);
      stats = fs.statSync(fileName2);
      console.log("lzwStats", stats);
    } else if (counter <= threshold) {
      counter++;
    } else {
      clearInterval(interval);
      reject(new Error(`${fileName2} was not created.`));
    }
  }, 1000);

  let encodedLz77String = Lz77.compress(data);
  readWriteFile(req.file.filename, encodedLz77String, "lz77");
  let fileName3 = req.file.filename;
  fileName3 =
    "./public/uploads/" + fileName2.slice(0, fileName2.length - 4) + ".lz77";

  counter = 0;
  threshold = 100;

  interval = setInterval(() => {
    if (fs.existsSync(fileName3) && fs.statSync(fileName3).size !== 0) {
      clearInterval(interval);
      stats = fs.statSync(fileName3);
      console.log("lz77Stats", stats);
    } else if (counter <= threshold) {
      counter++;
    } else {
      clearInterval(interval);
      reject(new Error(`${fileName3} was not created.`));
    }
  }, 1000);

  res.send(`summa`);
});

module.exports = router;
