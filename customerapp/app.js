import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import 'babel-polyfill'
import path from 'path'
import http from 'http'
import axios from 'axios'

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://sanc:sanc@cluster0.guuca.mongodb.net/certification?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const mongoose = require('mongoose');

mongoose.connect( uri, 
    { useNewUrlParser: true }).then(()=>{
        console.log("Connected to Database ")
    }).catch((err) => {
        console.log("error connecting to database! ", err);
    })


const app = express()
app.set('port', process.env.PORT || 8800);
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

// Cross-origin resource sharing (CORS) allows AJAX requests 
// to skip the Same-origin policy and access resources from remote hosts.
// the other express api on localhost:9900 can't be found without cors
app.use(cors())

app.set('view engine', 'ejs')
app.set('views', './views')


const Newslist = require('./models/newsmodel')
const Contactslist = require('./models/contactsmodel')

const getWeather = async () =>{
    const apikey = 'f443d734d889d6c735762b5fedab80b1'
    const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=${apikey}`
    try{
        return await axios.get(apiUrl)
    }catch(err){
        console.log(err)
    }
}

app.get('/', (req,res)=>{
        getWeather().then((response)=>{
            const weather = {
                description: response.data.weather[0].main,
                icon: "http://openweathermap.org/img/w/" + response.data.weather[0].icon + ".png",
                temperature: response.data.main.temp,
                temp_min: response.data.main.temp_min,
                temp_max: response.data.main.temp_max,
                city: response.data.name
            }
            console.log("weather: ", weather)

            Newslist.find({}).limit(3).sort( {insertTime: -1} ).exec( (err,data)=>{
                console.log(err)
                const news = data

                console.log("news : ", news)
                res.render('home', {
                    weather,
                    news
                })
            })
    
        })
})

app.get('/sports', (req,res)=>{
    const d = new Date().toISOString()
    const today = d.substring(0,10)

    const apiUrl = 'https://newsapi.org/v2/top-headlines' 
    axios.get(apiUrl, {
            params: {
                sources: 'espn',
                from: today,
                sortBy: 'popularity',
                language: 'en',
                apiKey: '98129a2a05e845ef84fec4963493b12e'
            }
        })
        .then( (response)=>{
            const data = response.data.articles
            res.render('sports', {data})
        })
        .catch(function (error) {
            console.log(error);
        })
})

app.get('/about_us', (req,res)=>{
    res.render('about_us')
})

app.get('/contact_us', (req,res)=>{
    res.render('contact_us', {
        msg: req.query.msg?req.query.msg:''
    })
})


app.post('/addContacts', (req,res)=>{    
    const record = req.body
    Contactslist.create(
            record  
        , (err, data) => {
            if(err){
                const htmlMsg = encodeURIComponent('Error : ', error);
                res.redirect('/contact_us/?msg=' + htmlMsg)
            }else{
                const htmlMsg = encodeURIComponent('OK Saved!');
                res.redirect('/contact_us/?msg=' + htmlMsg)
            }
            
        }) 
    
})

app.listen(app.get('port'), (err) => {
	if (err) {
		console.log("Error in customer app set up")
	}
	else{
		console.log("Server is running on port" + app.get('port'));
	}
})
