import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import dataUriToBuffer from 'data-uri-to-buffer'

// 7K8ic*z9W#c6
// vMnPGCuvR78[

var __dirname = process.cwd();

// const express     = require('express');
// const bodyParser  = require('body-parser');

// const fs = require('fs');
// const multer  = require('multer');

// const dataUriToBuffer = require('data-uri-to-buffer');

const upload = multer({dest: 'download/'});

const app = express();

// app.use(bodyParser.urlencoded({ extended: false }));

// // parse application/json
// app.use(bodyParser.json());

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(process.cwd() + '/'));
app.use('/', express.static(process.cwd() + '/public'));
app.use('/', express.static(process.cwd() + '/download'));
app.use('/', express.static(process.cwd() + '/tmp'));
app.set('json spaces', 2)
//Index page (static HTML)


app.route('/').get(function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

Date.prototype.YYYYMMDDHHMMSS = function () {
    var yyyy = this.getFullYear().toString();
    var MM = pad(this.getMonth() + 1,2);
    var dd = pad(this.getDate(), 2);
    var hh = pad(this.getHours(), 2);
    var mm = pad(this.getMinutes(), 2)
    var ss = pad(this.getSeconds(), 2)

    return yyyy + MM + dd+  hh + mm + ss;
};

function getDate() {
    var d = new Date();
    return d.YYYYMMDDHHMMSS();
}

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

app.route('/upload').post(async function(req,res){
    var data = req.body;
    // console.log(data.name, data.message, data.mode, data.filename);

    var cDate = getDate()

    if (data.mode == 'image'){
        fs.writeFileSync(__dirname + '/download/' + cDate + '.png', dataUriToBuffer(data.data), 'binary');
        fs.writeFileSync(__dirname + '/download/' + cDate + ".txt", data.name + "\n" + data.type + "\n" + Date.now() + "\n" + data.message);
        res.send("Upload successfull!"); 

    }else {
        fs.writeFileSync(__dirname + '/download/' + cDate + ".txt", data.name + "\n" + data.type + "\n" + Date.now() + "\n" + data.message)
        fs.rename(__dirname + '/download/' + data.filename, __dirname + '/download/' + cDate + "." + data.type, (err)=>{
            if (err){}
            else{
                console.log('File created!')
                res.send("Upload successfull!"); 
            }
        })
    }
})

app.post('/upload2', upload.single('file'), (req,res)=>{
    var file = req.file;
    console.log(file);
    res.json({filename: file.filename, type:file.mimetype.substring(file.mimetype.search('/')+1)});
})

app.post('/load', (req,res)=>{
    var dPath = __dirname + "/download";
    var ret = [];
    fs.readdirSync(dPath).forEach(file => {
        var file = path.parse(file);
        console.log(file);
        if (file.ext == '.txt'){
            var read = fs.readFileSync(dPath + "/" + file.base, 'utf-8').toString().split("\n");
            read[1] = read[1].toLocaleLowerCase();
            ret.push(
                {
                    username: read[0],
                    message: read[3],
                    file: file.name + "." + read[1],
                    time: parseInt(read[2]),
                    ext: read[1],
                    type: (read[1] == 'png' || read[1] == 'jpg' || read[1] == 'jpeg' ? 'image' : 'video')
                }
            )
            // console.log(read);
        }
    })
    res.json(ret);
})

app.route('/getUpdate').post((req,res)=>{
    var data = req.body;
    var dPath = __dirname + "/download";
    var cnt = 0;
    fs.readdirSync(dPath).forEach(file => {
        var file = path.parse(file);
        if (file.ext == '.txt'){
            cnt += 1;
        }
    })
    res.send({'update': cnt != data.cnt ? true : false, 'cnt': cnt});
})

app.get("/video/:video", function (req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoPath = __dirname + "/download/" + req.params.video;
    const videoSize = fs.statSync(videoPath).size;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": `video/${path.parse(videoPath).ext.substring(1)}`,
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
});

const listener = app.listen(process.env.PORT || 4000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});