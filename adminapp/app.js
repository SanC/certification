import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import 'babel-polyfill'
import path from 'path'
import http from 'http'
import axios from 'axios'
const config = require('./config.js');

const jwt = require('jsonwebtoken');

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://sanc:sanc@cluster0.guuca.mongodb.net/certification?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect( uri, 
    { useNewUrlParser: true }).then(()=>{
        console.log("Connected to Database ")
    }).catch((err) => {
        console.log("error connecting to database! ", err);
    })

const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./store');

const app = express()
app.set('port', process.env.PORT || 8801);
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

app.use(cors())

app.set('view engine', 'ejs')
app.set('views', './views')


const Newslist = require('./models/newsmodel')
const Contactslist = require('./models/contactsmodel')
const User = require('./models/usermodel');


app.get('/',(req,res) => {
    res.render('signin',
      { invalid: req.query.invalid?req.query.invalid:'',
        msg: req.query.msg?req.query.msg:''})
    
})

app.post('/register', (req,res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
      if (err) {
        return res.status(500).send('Error');
      }
      else 
      {
      let htmlMsg
      if(user){ 
         htmlMsg = encodeURIComponent('Email already taken !');
         res.redirect('/?msg=' + htmlMsg);
      }else{ 
       
        const hashedPasword = bcrypt.hashSync(req.body.password, 8);
        User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPasword,
        }, (err, user) => {
            if(err) return res.status(500).send('Error registering the user')
            htmlMsg = encodeURIComponent('User successfully registered!');
            res.redirect('/?msg=' + htmlMsg)
        })
      }
      
      }
    })     
})

app.post('/login', (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
  
      if (err) return res.status(500).send('Error.');
      let htmlMsg
      if (user) { 

        const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) {
          return res.status(401).send({ auth: false, token: null });
        }

        var token = jwt.sign({ id: user._id }, config.secret, {
            expiresIn: 86400 // expires in 24 hours
        });
        localStorage.setItem('authtoken', token)

        res.redirect(`/news`)
       
      }else{
         htmlMsg = encodeURIComponent('User/Email does not exists');
        res.redirect('/?invalid=' + htmlMsg);
      }
    });
});

app.get('/logout', (req,res) => {
    localStorage.removeItem('authtoken');
    res.redirect('/');
})

app.get('/news', (req, res)=>{
    const token = localStorage.getItem('authtoken')
    if (!token) {
        res.redirect('/')
    }
    jwt.verify(token, config.secret, (err, decoded)=>{
        if (err) { res.redirect('/') }
        User.findById(decoded.id, { password: 0}, (err,user)=>{
            if (err) {res.redirect('/')}
            if (!user) {res.redirect('/')} 
            res.render('news_form', {
                user,
                msg: req.query.msg?req.query.msg:''
            })
        })
    })
})

app.post('/addNews', (req, res)=>{
    const token = localStorage.getItem('authtoken')
    if (!token) {
        res.redirect('/')
    }
    jwt.verify(token, config.secret, (err, decoded)=>{
        if (err) { res.redirect('/') }
        User.findById(decoded.id, { password: 0}, (err,user)=>{
            if (err) {res.redirect('/')}
            if (!user) {res.redirect('/')} 
            
            const d = Date.now()
            const news = {...req.body, insertTime: d }
           
            Newslist.create(
                news
            , (err, data) => {
                if(err) return res.status(500).send('There was a problem registering user')
          
                const htmlMsg = encodeURIComponent('added news');
                res.redirect('/news/?msg=' + htmlMsg)
            })            

        })
    })
})

app.get('/getNews', (req, res)=>{
    const token = localStorage.getItem('authtoken')
    if (!token) {
        res.redirect('/')
    }
    jwt.verify(token, config.secret, (err, decoded)=>{
        if (err) { res.redirect('/') }
        User.findById(decoded.id, { password: 0}, (err,user)=>{
            if (err) {res.redirect('/')}
            if (!user) {res.redirect('/')} 
            Newslist.find({}, (err,data)=>{
                if(err) res.status(500).send(err)
                else{
                    res.render('news_table', {
                        user,
                        data
                    })
                }        
            })
          
        })
    })
})

app.post('/find_by_id', (req,res)=>{
    const id = req.body.id
    Newslist.find({_id: id}, (err,data)=>{
        if(err) res.status(500).send(err)
        else{
            res.send(data)
        }
    })
})

app.put('/updateNews', (req,res)=>{
    const id = req.body.id
    Newslist.findOneAndUpdate({_id: id},{
        $set:{
            title: req.body.title,
            description: req.body.description,
            url: req.body.url,
            urlToImage: req.body.urlToImage,
            publishedAt: req.body.publishedAt,
            insertTime: Date.now()
        }
    },{
        upsert: true
    }, (err,result)=>{
        if(err) return res.send(err)
        res.send("Updated the news")
    }) 
})

app.delete('/deleteNews', (req,res)=>{
    const id = req.body.id
    Newslist.findOneAndDelete({_id: id}, (err,result)=>{
        if(err) return res.status(500).send(err)
        res.send({message: 'deleted ...'})
    })
})

app.listen(app.get('port'), (err) => {
	if (err) {
		console.log("Error in launching server")
	}
	else{
		console.log("Server is running on port" + app.get('port'));
	}
})
