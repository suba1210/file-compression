const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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
    res.send(req.file.filename);
});

module.exports = router;
