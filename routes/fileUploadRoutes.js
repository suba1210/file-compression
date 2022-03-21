const express = require('express'); 
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename : function(req, file, cb){
        cb(null,file.fieldname + '-' +Date.now()+path.extname(file.originalname));
    }
});


const upload = multer({
    storage: storage,
    fileFilter : function(req,file,cb){
        checkFileType(file,cb);
    }
}).single('image');


function checkFileType(file,cb){
    const filetypes = /txt|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    }else {
        cb('Error : Images only');
    }
}

router.get('/home' , async(req,res)=>{
    res.render('homePage');
});

router.post('/addFile', async(req,res)=>{
    upload(req,res,(err) => {
        if(err){
            res.send('error');
            console.log(err);
        }  else {
            let uploadedFile = fs.readFileSync(path.join('./public/uploads/' + req.file.filename));  
            res.send(uploadedFile);
        }
    });
});



module.exports = router;