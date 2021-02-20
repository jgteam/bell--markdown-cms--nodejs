// --- Setup and Dependencies

const express = require('express');
const app = express();
const http = require('http').Server(app);
const uuid = require('uuid');
const escapeStringRegexp = require('escape-string-regexp');
const fs = require('fs');
const bodyParser = require('body-parser');
const showdown  = require('showdown'); // Wird benutzt um Markdown in HTML zu verwandeln
const converter = new showdown.Converter();

// Port und Root-URL
const port = 3000;
const ROOT = getConfigValue("ROOT");

// --- Middlewares

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // EJS aktivieren

// --- Functions and app.locals
// app.locals und res.app.locals können Variablen und Funktionen sein, welche später in den .ejs-Dateien genutzt werden können

app.locals.ROOT = ROOT;

// Öffnet die angeforderte Seite. (z.B. openPage("fixedpages", "home.md");)
function openPage(folder, name){

    // Variablen welche später in einem JS-Objekt zurückgegeben werden
    var meta = []; // Metadaten wie z.B. der Titel
    var fileBody; // Zeichenkette des Dokumenten-Body (also ohne den Head)
    var fileText; // Zeichenkette des Dokumenten-Body ohne Element-Blöcke, stattdessen mit Platzhaltern (also ohne z.B. Action-Buttons und Head)
    var fileElements; // Speichert alle im Dokument vorhandenen Element-Blöcke
    var uniquePlaceholder; // Speichert den einzigartigen Platzhalter


    // Kompletter Inhalt des Dokumentes
    var fileContent = "";

    try {
        fileContent = fs.readFileSync('./usercontent/' + folder + '/' + name, 'utf8')
    } catch (err) {
        return false;
        console.error(err)
    }

    // Dokumenten-Head auslesen
    matches = fileContent.match(/(.)*\[DOCUMENTSTART\]/s);
    var fileHead = matches[0];

    // Kommentare aus dem Head entfernen
    fileHead = fileHead.replace(/\/\/(.)*/, "")

    // Metadaten auslesen

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


    // Dokumenten-Body auslesen


    // Head entfernen
    matches = fileContent.match(/\[DOCUMENTSTART\](.)*/s);
    // 15 => wegen "[DOCUMENTSTART]"
    fileBody = matches[0].substring(15);


    // Dokumenten-Text auslesen

    // Note: Die Platzhalter werden genutzt, um später den Platzhalter mit dem generierten HTML-Code zu ersetzen

    // Platzhalter erstellen
    uniquePlaceholder = "[ELEMENT-PLACEHOLDER-"+uuid.v4()+"]";

    // Element-Blöcke durch den Platzhalter ersetzten
    fileText = fileBody.replace(/(\[ACTION\](.+?)\[\/ACTION\])/sg, uniquePlaceholder);

    // Element-Blöcke auslesen
    fileElements = fileContent.match(/(\[ACTION\](.+?)\[\/ACTION\])/sg);

    // Die benötigten Variablen in einem JS-Objekt ausgeben
    return {
        meta: meta,
        fileBody: fileBody,
        fileText: fileText,
        fileElements: fileElements,
        uniquePlaceholder: uniquePlaceholder,
    };


}

// Druckt das Dokument an dieser Stelle
function printDocumentHere(fileText, fileElements, uniquePlaceholder){

    // Platzhalter um Paragraphen-HTML-Tags erweitern
    uniquePlaceholder = "<p>"+uniquePlaceholder+"</p>";

    // HTML aus dem MarkdownText generieren
    var html = converter.makeHtml(fileText);

    if(fileElements !== null) {

        // Jedes Element ersetzt nun nach der Reihe einen Platzhalter
        fileElements.forEach(function (element) {

            // Attribute des Elementes auslesen
            var href = getAttribute("href", element);
            href = href.replace("\$ROOT\$", ROOT);
            var text = getAttribute("text", element);
            var icon = getAttribute("icon", element);

            // Generiert den Aktion-Button (aktuell einziges verfügbares Element-Block)
            var elementHtml = actionButton(href, text, icon);

            // Ersetzt den nächsten Platzhalter mit dem Aktionbutton
            html = html.replace(new RegExp(escapeStringRegexp(uniquePlaceholder)), elementHtml)

        });

    }

    // Gibt das HTML zurück
    return html;

}
app.locals.printDocumentHere = printDocumentHere;

// Filtert ein Attribut-Wert aus einem Source-String mittels des Attributen-Schlüssels
function getAttribute(key, source) {

    // Attribute, welche Groß- und Kleinschreibung nicht beachten müssen (werden später in Kleinbuchstaben umgewandelt)
    var incasesensitiveKeys = ["showlatestwork", "type"];

    // Nach dem Attribut mittels des Schlüssels suchen
    var matches = source.match(new RegExp(key+":(.)*", "i"))

    if(matches !== null){

        // Attributwert Filtern
        var out = matches[0].replace(new RegExp(key+":", "i"), "").trim();

        // Wert in Kleinbuchstaben umwandeln, falls erwünscht
        if(incasesensitiveKeys.includes(key))
            out = out.toLowerCase();

        // Wert zurückgeben
        return out;

    }

    // Null zurückgeben, falls es kein Treffer gab
    return null;

}

// Filtert ein Config-Attribut-Wert aus einem Source-String mittels des Attributen-Schlüssels
// (Unterschied zu getAttribute(): Hier wird des Schlüssel mit zwei Doppelpunkten vom Wert getrennt)
function getConfig(key, source) {

    var matches = source.match(new RegExp(key+"::(.)*", "i"))

    if(matches !== null){

        var out = matches[0].replace(new RegExp(key+"::", "i"), "").trim();

        return out;

    }

    return false;

}

// Filtert ein Config-Attribut-Wert aus den Config.conf-Datei mittels des Attributen-Schlüssels
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

// Liefert alles Projektnamen (Dateinamen) und Projektdaten (Datum) in einem Array zurück (nach Datum sortiert)
function getAllProjects() {

    // Alle Dateinamen aus dem Ordner holen
    var files = fs.readdirSync("./usercontent/projects/");


    // Daten auslesen und in ein geeignetes Array schreiben (gespeichert werden Dateinamen und Datum)
    var filesWithDates = [];
    files.forEach(function (file) {

        var filePath = "./usercontent/projects/"+file;

        var fileContent = "";

        try {
            fileContent = fs.readFileSync(filePath, 'utf8')
        } catch (err) {
            console.error(err)
        }

        // Datum auslesen
        var fileDate = getAttribute("Date", fileContent);

        var datedFile = [];
        datedFile['fileName'] = file;
        datedFile['fileDate'] = fileDate;

        filesWithDates.push(datedFile);

    });

    // Array nach dem Datumsschlüssel (fileDate) sortieren

    // Sortieralgorithmus, welcher nach dem Array-Key "fileDate" den Array sortieren kann
    // https://www.sitepoint.com/sort-array-index/
    filesWithDates.sort(function(a, b){
        var a1= a['fileDate'], b1= b['fileDate'];
        if(a1 == b1) return 0;
        return a1> b1? 1: -1;
    });

    // Array umkehren, damit der neuste Eintrag an erster Stelle steht
    filesWithDates = filesWithDates.reverse();

    // Array zurückgeben
    return filesWithDates;

}

// Gibt den Dateinamen des neusten Projektes zurück
function getLatestProject() {
    return getAllProjects()[0]['fileName'];
}
app.locals.getLatestProject = getLatestProject;

// Generiert das HTML für einen Aktionbutton
function actionButton(href, text, icon = null) {

    var html = "";

    // "no-icon"-Klasse, wenn kein Icon übergeben wurde
    if(icon == null) {
        html += '<a class="action-button no-icon" href="'+href+'" target="_blank">';
    } else {
        html += '<a class="action-button" href="'+href+'" target="_blank">';
    }
    html += '    <div class="button-wrapper">';

    // Icon platzieren, falls eins übergeben wurde
    if(icon != null)
        html += '        <div class="icon" style="background-image: url(\''+ROOT+'usercontent/icons/'+icon+'\')"></div>';

    html += '        <span>'+text+'</span>';
    html += '    </div>';
    html += '</a>';

    return html;

}

// Generiert das HTML für eine Projektkarte und gibt den Text direkt aus
function projectCard(projectFile) {

    // HTML-Ausgabe
    var out = "";

    // Link zu dem Projekt
    var href = ROOT+"project/"+projectFile.substring(0, projectFile.length - 3);

    // Pfad zu der Markdown-Datei des Projektes
    var filePath = "./usercontent/projects/" + projectFile;

    // Dokumentinhalt des Projektes
    var fileContent;

    try {
        fileContent = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
        console.error(err)
    }

    // Titel und Vorschaubild auslesen
    var fileTitle =  getAttribute("Title", fileContent);
    var filePreviewImage = getAttribute("PreviewImage", fileContent);

    //... HTML generieren

    out += '<a class="project-card" href="'+href+'">';

    out += '    <div class="card-wrapper">';



    // Fügt das Logo anstelle eines Vorschaubildes ein, falls keins vorhanden ist
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

    // HTML zurückgeben

    return out;

}
app.locals.projectCard = projectCard;

// Liest die Menu.conf-Datei aus
function readMenuConfig() {

    // Beinhaltet später die Links
    var links = [];

    // Dateipfad
    var menuConfigFile = "./usercontent/config/menu.conf";

    // Dateiinhalt
    var configFileContent;

    try {
        configFileContent = fs.readFileSync(menuConfigFile, 'utf8')
    } catch (err) {
        console.error(err)
    }


    // Quelle: regex101.com
    const regex = /(.)*::(.)*/ig;
    let match;
    var matches = []; // Treffer-Array

    while ((match = regex.exec(configFileContent)) !== null) {
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        matches.push(match); // Jeder Treffer wird in das matches-Array hinzugefügt
    }

    if (matches !== null) {

        matches.forEach(function (line){
            // ... jede Treffer:

            // Trennt den Text vom Link
            var splitLine = line[0].split("::");

            // Schreibt den Text und den Link in ein Array, welcher im links-Array gespeichert wird
            var link = [];
            link['text'] = splitLine[0];
            link['href'] = splitLine[1].replace("\$ROOT\$", ROOT);

            links.push(link);

        });

    }

    // Gibt die Links zurück
    return links;

}

// Druckt das Headermenu an dieser Stelle
function printHeaderMenuHere() {

    // HTML-Ausgabe
    var out = "";

    // Beinhaltet alle Links
    var menu = readMenuConfig();

    menu.forEach(function (menuItem) {

        // Generiert alle Links
        out += '<a class="anchor-button" href="'+menuItem["href"]+'">'+menuItem['text']+'</a>';

    });

    // HTML zurückgeben
    return out;

}
app.locals.printHeaderMenuHere = printHeaderMenuHere;

// Druckt die Projekt-Galerie an dieser Stelle
function printProjectCardGalleryHere() {

    // HTML-Ausgabe
    var out = "";

    // ... für alle Projekte
    getAllProjects().forEach(function (project) {

        // Generiert eine ProjektCard
        out += projectCard(project['fileName']);

    });

    // HTML zurückgeben
    return out;

}
app.locals.printProjectCardGalleryHere = printProjectCardGalleryHere;

// --- Routes

// Weiterleitung bei z.B. domain.com/OPEN/xy
app.get('/open/:key', function(req, res, next) {

    var key = req.params.key;

    // Menu.conf-Datei auslesen

    var config;

    try {
        config = fs.readFileSync("./usercontent/config/redirects.conf", 'utf8')
    } catch (err) {
        console.error(err)
    }

    // URL bekommen
    var redirectURL = getConfig(key, config);

    // Weiterleiten falls valide, ansonsten Weiterleitung zur Startseite
    if(redirectURL) {
        res.redirect(redirectURL);
    } else {
        res.redirect(ROOT);
    }

});

// Diese Routen fangen für die "fixedpages", also auch die Seiten für
// die Projekte und für die benutzerdefinierten Seiten, Informationen ab.

// Falls eine der Routen greift, wird über die Request-Variable (req)
// und next() die Seite an die nächste Route übergeben
app.get('/mywork', function(req, res, next) {
    req.fixedpage = "mywork";
    next();
});
app.get('/contact', function(req, res, next) {
    req.fixedpage = "contact";
    next();
});
app.get('/privacy-policy', function(req, res, next) {
    req.fixedpage = "privacy-policy";
    next();
});
app.get('/legal-notice', function(req, res, next) {
    req.fixedpage = "legal-notice";
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


// Diese Route greift sowohl bei der RootURL, als auch bei den sechs vorherigen Routen.
// D.h. diese Route fängt u. a. auch die Informationen dieser vorherigen ab und verarbeitet diese.
app.get(['/', '/mywork', '/contact', '/privacy-policy', '/legal-notice', '/page/:name', '/project/:name'], function(req, res){

    // Speichert Datei-Ordner und Datei-Name vom angeforderten Dokument
    var preparedFileName = null;
    var preparedFileFolder = null;

    // falls Variable "fixedpage" existiert
    if(req.fixedpage !== undefined) {
        // ... wird die Informationen des angeforderte Seite in die beiden Variablen gepackt
        preparedFileName = req.fixedpage+".md";
        preparedFileFolder = "fixedpages";
    }

    // falls Variable "custompage" existiert
    if(req.custompage !== undefined) {
        // ... wird die Informationen des angeforderte Seite in die beiden Variablen gepackt
        preparedFileName = req.custompage+".md";
        preparedFileFolder = "pages";
    }

    // falls Variable "customproject" existiert
    if(req.customproject !== undefined) {
        // ... wird die Informationen des angeforderte Seite in die beiden Variablen gepackt
        preparedFileName = req.customproject+".md";
        preparedFileFolder = "projects";
    }

    // falls keine der oberen Variablen existiert und die beiden Variablen immer noch = null sind
    if(preparedFileName === null || preparedFileFolder === null) {
        // ... dann wird die Startseite angefordert
        preparedFileName = "home.md";
        preparedFileFolder = "fixedpages";
    }

    // angefordertes Dokument wird geöffnet
    var openPage_output = openPage(preparedFileFolder, preparedFileName);

    // Überprüfung, ob das angeforderte Dokument existiert. Falls nicht wird man zur Startseite weitergeleitet
    if(!openPage_output)
        res.redirect(ROOT);

    // Webseitentitel, welcher im Browser-Tab-Titel stehen wird
    var headTitle = getConfigValue("headtitle");
    var pageTitleMeta = headTitle;

    // Falls nicht die Startseite aufgerufen wird, wird der Titel des Dokumentes an den Webseitentitel hinzugefügt
    if(openPage_output.meta.Type != "home") {
        pageTitleMeta = headTitle + " — " + openPage_output.meta.Title;
    }

    // res.app.locals bereitstellen

    // Meta-Daten werden ausgelesen
    res.app.locals.pageType = openPage_output.meta.Type;
    res.app.locals.pageTitle = openPage_output.meta.Title;

    res.app.locals.pageTitleMeta = pageTitleMeta;

    // Restlicher OutPut der openPage()-Funktion
    res.app.locals.meta = openPage_output.meta;
    res.app.locals.fileBody = openPage_output.fileBody;
    res.app.locals.fileText = openPage_output.fileText;
    res.app.locals.fileElements = openPage_output.fileElements;
    res.app.locals.uniquePlaceholder = openPage_output.uniquePlaceholder;

    // index.ejs rendern und an der Client senden
    res.render('index');

});

// Statische Dateien bereitstellen
app.use('/assets/', express.static('assets'));
app.use('/usercontent/fixedlogos', express.static('usercontent/fixedlogos'));
app.use('/usercontent/icons', express.static('usercontent/icons'));
app.use('/usercontent/images', express.static('usercontent/images'));

// --- Start listening
http.listen(port, function(){
    console.log('Listening on port ' + port);
});