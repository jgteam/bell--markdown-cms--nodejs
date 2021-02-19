// --- Setup and Dependencies

const express = require('express');
const app = express();
const http = require('http').Server(app);

const uuid = require('uuid');
const escapeStringRegexp = require('escape-string-regexp');

const fs = require('fs');

const showdown  = require('showdown');
const converter = new showdown.Converter();


app.set('view engine', 'ejs');

const bodyParser = require('body-parser');

const port = 3000;
const ROOT = "http://localhost:3000/";

// --- Middlewares

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// App-Variables and -Functions EJS can use later

app.locals.ROOT = ROOT;

function getConfigValue(key) {

    var config;

    try {
        config = fs.readFileSync("./usercontent/config/config.conf", 'utf8')
    } catch (err) {
        console.error(err)
    }

    return getConfig(key, config);

}
app.locals.getConfigValue = getConfigValue;

function getConfig(key, source) {

    var matches = source.match(new RegExp(key+"::(.)*", "i"))

    if(matches !== null){

        var out = matches[0].replace(new RegExp(key+"::", "i"), "").trim();

        return out;

    }

    return false;

}

function printHeaderMenuHere() {

    var out = "";

    var menu = readMenuConfig();

    menu.forEach(function (menuItem) {

        out += '<a class="anchor-button" href="'+menuItem["href"]+'">'+menuItem['text']+'</a>';

    });

    return out;

}
app.locals.printHeaderMenuHere = printHeaderMenuHere;


function readMenuConfig() {

    var links = [];

    var menuConfigFile = "./usercontent/config/menu.conf";

    var configFileContent;

    try {
        configFileContent = fs.readFileSync(menuConfigFile, 'utf8')
    } catch (err) {
        console.error(err)
    }


    // regex101.com

    const regex = /(.)*::(.)*/ig;
    let match;
    var matches = [];

    while ((match = regex.exec(configFileContent)) !== null) {
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        matches.push(match);
    }

    if (matches !== null) {

        matches.forEach(function (line){

            var splitLine = line[0].split("::");

            var link = [];
            link['text'] = splitLine[0];
            link['href'] = splitLine[1].replace("\$ROOT\$", ROOT);

            links.push(link);

        });

    }

    return links;

}

function openPage(folder, name){

    var meta = [];
    var fileBody;
    var fileText;
    var fileElements;
    var uniquePlaceholder;


    var fileContent = "";

    try {
        fileContent = fs.readFileSync('./usercontent/' + folder + '/' + name, 'utf8')
    } catch (err) {
        return false;
        console.error(err)
    }


    // GET FILE HEAD/METADATA
    matches = fileContent.match(/(.)*\[DOCUMENTSTART\]/s);

    var fileHead = matches[0];

    // REMOVE COMMENTS IN HEAD
    fileHead = fileHead.replace(/\/\/(.)*/, "")

    //Title
    meta['Title'] = getAttribute("Title", fileHead);

    //Date
    meta['Date'] = getAttribute("Date", fileHead);

    //ShowLatestWork
    meta['ShowLatestWork'] = getAttribute("ShowLatestWork", fileHead);

    //LatestWorkHeading
    meta['LatestWorkHeading'] = getAttribute("LatestWorkHeading", fileHead);

    //Type
    meta['Type'] = getAttribute("Type", fileHead);



    // GET FILE BODY


    matches = fileContent.match(/\[DOCUMENTSTART\](.)*/s);

    // 15 => "[DOCUMENTSTART]"
    // REMOVING HEAD
    fileBody = matches[0].substring(15);


    uniquePlaceholder = "[ELEMENT-PLACEHOLDER-"+uuid.v4()+"]";

    fileText = fileBody.replace(/(\[ACTION\](.+?)\[\/ACTION\])/sg, uniquePlaceholder);

    // GET FILE ELEMENTS

    fileElements = fileContent.match(/(\[ACTION\](.+?)\[\/ACTION\])/sg);

    return {
        meta: meta,
        fileBody: fileBody,
        fileText: fileText,
        fileElements: fileElements,
        uniquePlaceholder: uniquePlaceholder,
    };


}

function printDocumentHere(fileText, fileElements, uniquePlaceholder){


    uniquePlaceholder = "<p>"+uniquePlaceholder+"</p>";

    var html = converter.makeHtml(fileText);

    if(fileElements !== null) {


        fileElements.forEach(function (element) {

            var href = getAttribute("href", element);
            href = href.replace("\$ROOT\$", ROOT);
            var text = getAttribute("text", element);
            var icon = getAttribute("icon", element);

            var elementHtml = actionButton(href, text, icon);

            html = html.replace(new RegExp(escapeStringRegexp(uniquePlaceholder)), elementHtml)

        });

    }

    return html;

}
app.locals.printDocumentHere = printDocumentHere;

function actionButton(href, text, icon = null) {

    var html = "";

    if(icon == null) {
        html += '<a class="action-button no-icon" href="'+href+'" target="_blank">';
    } else {
        html += '<a class="action-button" href="'+href+'" target="_blank">';
    }
    html += '    <div class="button-wrapper">';

    if(icon != null)
        html += '        <div class="icon" style="background-image: url(\''+ROOT+'usercontent/icons/'+icon+'\')"></div>';

    html += '        <span>'+text+'</span>';
    html += '    </div>';
    html += '</a>';

    return html;

}

function projectCard(projectFile) {

    var out = "";

    var href = ROOT+"project/"+projectFile.substring(0, projectFile.length - 3);

    var filePath = "./usercontent/projects/" + projectFile;

    var fileContent;

    try {
        fileContent = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
        console.error(err)
    }

    var fileTitle =  getAttribute("Title", fileContent);
    var filePreviewImage = getAttribute("PreviewImage", fileContent);


    out += '<a class="project-card" href="'+href+'">';

    out += '    <div class="card-wrapper">';



    if(filePreviewImage === null) {

        filePreviewImage = ROOT+"usercontent/fixedlogos/smalllogo.svg";
        out += '        <div class="card-preview-container"><div class="card-preview empty" style="background-image: url(\''+filePreviewImage+'\')"></div></div>';

    } else {

        filePreviewImage = ROOT+"usercontent/images/"+filePreviewImage;
        out += '        <div class="card-preview-container"><div class="card-preview" style="background-image: url(\''+filePreviewImage+'\')"></div></div>';

    }


    out += '        <h3 class="card-title">'+fileTitle+'</h3>';
    out += '    </div>';
    out += '</a>';


    return out;


}
app.locals.projectCard = projectCard;

function getAttribute(key, source) {

    var incasesensitiveKeys = ["showlatestwork", "type"];

    var matches = source.match(new RegExp(key+":(.)*", "i"))

    if(matches !== null){

        var out = matches[0].replace(new RegExp(key+":", "i"), "").trim();

        if(incasesensitiveKeys.includes(key))
            out = out.toLowerCase();

        return out;

    }

    return null;

}

function getAllProjects() {

    // Alle Dateinamen aus dem Ordner holen
    var files = fs.readdirSync("./usercontent/projects/");

    var filesWithDates = [];

    files.forEach(function (file) {

        var filePath = "./usercontent/projects/"+file;

        var fileContent = "";

        try {
            fileContent = fs.readFileSync(filePath, 'utf8')
        } catch (err) {
            console.error(err)
        }

        var fileDate = getAttribute("Date", fileContent);

        var datedFile = [];
        datedFile['fileName'] = file;
        datedFile['fileDate'] = fileDate;

        filesWithDates.push(datedFile);

    });

    // https://www.sitepoint.com/sort-array-index/
    filesWithDates.sort(function(a, b){
        var a1= a['fileDate'], b1= b['fileDate'];
        if(a1 == b1) return 0;
        return a1> b1? 1: -1;
    });

    filesWithDates = filesWithDates.reverse();

    return filesWithDates;

}

function getLatestProject() {
    return getAllProjects()[0]['fileName'];
}
app.locals.getLatestProject = getLatestProject;

function printProjectCardGalleryHere() {

    var out = "";

    getAllProjects().forEach(function (project) {

        out += projectCard(project['fileName']);

    });

    return out;

}
app.locals.printProjectCardGalleryHere = printProjectCardGalleryHere;

// --- EJS-Files


app.get('/open/:key', function(req, res, next) {

    var key = req.params.key;

    var config;

    try {
        config = fs.readFileSync("./usercontent/config/redirects.conf", 'utf8')
    } catch (err) {
        console.error(err)
    }

    var redirectURL = getConfig(key, config);

    if(redirectURL) {
        res.redirect(redirectURL);
    } else {
        res.redirect(ROOT);
    }

});


app.get('/mywork', function(req, res, next) {
    req.fixedPage = "mywork";
    next();
});
app.get('/contact', function(req, res, next) {
    req.fixedPage = "contact";
    next();
});
app.get('/privacy-policy', function(req, res, next) {
    req.fixedPage = "privacy-policy";
    next();
});
app.get('/legal-notice', function(req, res, next) {
    req.fixedPage = "legal-notice";
    next();
});
app.get('/page/:name', function(req, res, next) {
    req.custompage = req.params.name;
    next();
});
app.get('/project/:name', function(req, res, next) {
    req.customproject = req.params.name;
    next();
});



app.get(['/', '/mywork', '/contact', '/privacy-policy', '/legal-notice', '/page/:name', '/project/:name'], function(req, res){

    var preparedFileName = null;
    var preparedFileFolder = null;

    if(req.fixedPage !== undefined) {
        preparedFileName = req.fixedPage+".md";
        preparedFileFolder = "fixedpages";
    }

    if(req.custompage !== undefined) {
        preparedFileName = req.custompage+".md";
        preparedFileFolder = "pages";
    }

    if(req.customproject !== undefined) {
        preparedFileName = req.customproject+".md";
        preparedFileFolder = "projects";
    }

    if(preparedFileName === null || preparedFileFolder === null) {
        preparedFileName = "home.md";
        preparedFileFolder = "fixedpages";
    }

    var openPage_output = openPage(preparedFileFolder, preparedFileName);

    if(!openPage_output)
        res.redirect(ROOT);


    var headTitle = getConfigValue("headtitle");
    var pageTitleMeta = headTitle;
    if(openPage_output.meta.Type != "home") {

        pageTitleMeta = headTitle + " — " + openPage_output.meta.Title;

    }


    res.app.locals.pageType = openPage_output.meta.Type;
    res.app.locals.pageTitle = openPage_output.meta.Title;
    res.app.locals.pageTitleMeta = pageTitleMeta;

    res.app.locals.meta = openPage_output.meta;
    res.app.locals.fileBody = openPage_output.fileBody;
    res.app.locals.fileText = openPage_output.fileText;
    res.app.locals.fileElements = openPage_output.fileElements;
    res.app.locals.uniquePlaceholder = openPage_output.uniquePlaceholder;


    res.render('index');

});

app.use('/assets/', express.static('assets'));
app.use('/usercontent/', express.static('usercontent'));



// --- Start listening
http.listen(port, function(){
    console.log('Listening on port ' + port);
});