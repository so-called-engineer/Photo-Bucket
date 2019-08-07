var express = require("express");
var app = express();
var path = require('path');
var port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var multer = require('multer');
ObjectId = require('mongodb').ObjectId;
var fs = require('fs-extra');
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://user:passwordd@wrongguy-ectz3.mongodb.net/test?retryWrites=true&w=majority",{  //test
    useNewUrlParser: true
},function(err){
    if(err){
        console.log(err);
    }else {
        console.log("connection established");
    }
});
var nameSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
});

var User = mongoose.model("User", nameSchema);

var name1Schema = new mongoose.Schema({
    description: String,
    contentType: String,
    size: Number,
    img: Buffer
});

var User1 = mongoose.model("User1", name1Schema);

app.set('view engine','ejs');

upload = multer({limits: {fileSize: 2000000 },dest:'/uploads/'})

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    var erro = ""
    res.render('signin',{erro});
});

app.get("/terms", (req, res) => {
    res.render('terms');
});

app.get("/signup", (req, res) => {
    var mismatch = ""
    res.render('signup',{mismatch});
});

app.post("/login", (req, res) => {
    User.find(req.body,function(err,result){
        if(err){
            throw err;
        } else if(result.length > 0){
            var user = req.body.username
            User1.find({},function(err,resp){
                if(err){
                    throw err;
                } else {
                    res.render('home1',{user,resp});
                }
                for(var i=0; i < resp.length; i++){
                    let respon = resp[i]
                    app.get(`/${i}`,(req,res) => {
                        res.render('page',{user,respon});
                    })
                    delete respon[i];
                }
            })
        } else {
            var erro="Username or Password is incorrect"
            res.render('signin',{erro});
        }
    })
});

app.post('/signup', (req, res) => {
    var user = req.body.username;
    var pass = req.body.password;
    var repass = req.body.repass;
    var email = req.body.email;
    var agree = req.body.check;
    if(pass === repass && user.length>0 && pass.length>8 && email.length>0 && agree == "on"){
        User(req.body).save()
        .then(item => {
            var erro = ""
            res.render('signin',{erro});    
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
    } else if(user.length==0 || pass.length==0 && email.length==0 || repass.length == 0){
        var mismatch = "All the input fields are necessary"
        res.render('signup', {mismatch})
    } else if(pass != repass){
        var mismatch = "Both passwords should match"
        res.render('signup', {mismatch})
    } else if(pass.length < 8){
        var mismatch = "Password should atleast contain 8 letters"
        res.render('signup', {mismatch})
    } else if(agree != "on"){
        var mismatch = "You should check  terms of service checkbox"
        res.render('signup', {mismatch})
    }
});

app.get('/upload',(req,res)=>{
    res.render('index')
});

app.post('/uploadpicture', upload.single('picture'), function (req, res){
    if (req.file == null) {
    res.render('index', { title:'Please select a picture file to submit!' });
    } else {
        // read the img file from tmp in-memory location
        var newImg = fs.readFileSync(req.file.path);
        // encode the file as a base64 string.
        var encImg = newImg.toString('base64');
        // define your new document
        var newItem = {
            description: req.body.description,
            contentType: req.file.mimetype,
            size: req.file.size,
            img: Buffer.from(encImg, 'base64')
        };
        User1(newItem).save()
        .then(item => {
            fs.remove(req.file.path, function(err) {
                if (err) { console.log(err) };
                res.render('index', {title:'Thanks for the Picture!'});
            });   
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });           
    };
});

app.get('/picture/:picture', function(req, res){
    var filename = req.params.picture;
    User1.find({'_id': ObjectId(filename)},function(err,results){
        if(err){
            throw err;
        } else {
            res.setHeader('content-type', results[0].contentType);
            res.send(results[0].img);
        }
    });
});
            
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
