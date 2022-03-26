const express = require('express');
const path = require('path');

const app = express();

const routes = require('./routes/routes');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

app.get('/', async(req,res)=>{
    res.redirect('/home');
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});
