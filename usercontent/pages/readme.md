Title: Getting started with markdown-cms
Date: 2021-03-26
Type: article

[DOCUMENTSTART]

In diesem Readme erfährst du alles rund um das markdown-cms.

## Aufbau im Backend

Um die Seiten deinen Vorstellungen anpassen zu können, musst du Zugriff auf das Dateisystem haben. Im Ordner `usercontent` wirst du alle relevante Dateien finden um Inhalte diverser Seiten aber auch allgemeine Einstellungen pflegen zu können.

## Konfigurationsdateien

```
usercontent/config
 - config.conf
 - menu.conf
 - redirect.conf
```

### config.conf

Die `config.conf` ist die allgemeine Konfigurationsdatei. Hier kannst du beispielsweise den Fenstertitel, aber auch den Copyright-Text deinen Wünschen anpassen.

Standardmäßig sieht die `config.conf` folgendermaßen aus:
```
ROOT::https://example.de/

headTitle::Markdown CMS

copyrightText::Max Mustermann

firstSocialText::Github
firstSocialLink::https://github.com/maxmustermann

secondSocialText::Linked In
secondSocialLink::https://www.linkedin.com/in/maxmustermann/
```
Beachte, dass verfügbaren Schlüssel fix sind und vorhanden sein sollten.


### menu.conf

Die `menu.conf` beinhaltet alle deine Links für den Header.

Standardmäßig sieht die `menu.conf` folgendermaßen aus:
```
my work::$ROOT$mywork
contact::$ROOT$contact
readme::$ROOT$page/readme
```
Diese Schlüssel können beliebig benannt werden und spiegeln den gezeigten Text des Links wider. D. h. du kannst auch beliebig viele Links in die Konfigurationsdatei vermerken, dabei wird die Reihenfolge übernommen.

Mit `$ROOT$` kannst du einen Platzhalter der StammURL deiner Seite in deinen Links verwenden. So kann `$ROOT$mywork` zu `https://example.com/mywork` werden.


### redirect.conf

Die `redirect.conf` beinhaltet alle deine Links für Weiterleitungen und könnte zum Beispiel so aussehen:
```
github::https://github.com/maxmustermann
```

Weiterleitungen sind unter `/open/` erreichbar.

So würde `https://example.com/open/github` zu `https://github.com/maxmustermann` weiterleiten.

## Seiten mit Inhalten

Seiten mit Inhalten sind in diesen Ordnern hinterlegt:

```
usercontent/fixedpages
usercontent/pages
usercontent/projects
```

Unter `fixedpages` findest du die festen Seiten, wie die Startseite, aber auch die Datenschutzseite. In diesem Ordner sollten keine Dateien erstellt oder gelöscht werden.

Die anderen beiden Ordner beinhalten alle selbst erzeugten Seiten. Somit kann durch die Erstellung und Löschung von Markdown-Dateien in diesen Ordnern Seiten und Projekte erstellt und gelöscht werden.
Die Seiten und Projekte sind dann unter dem Dateinamen auf dem Server wiederzufinden. Seiten unter `https://example.com/page/PAGENAME` und Projekte unter `https://example.com/project/PROJECTNAME`, jeweils ohne die Markdown-Dateiendung.

Am besten schaust du dir einfach die schon vorhandenen Seiten und Projekte an und benutzte diese als Vorlage. Wenn du den dreh raus hast, können sie einfach gelöscht werden.

Wichtig zu wissen ist, dass alle Markdown-Seiten einen Header haben. Dieser wird durch das Schlüsselwort `DOCUMENTSTART` innerhalb eckiger Klammern von dem Dateibody getrennt.

## Markdown-CMS-eigene Blöcke/Elemente

Es gibt Blöcke/Elemente, welche in den Markdown-Dateien verwendet werden können, um mehr als nur die von Markdown bereitgestellten Elemente darstellen zu können. Aktuell gibt es nur den sogenannten Action-Button. Schau mal in die Startseite (`usercontent/fixedpages/home.md`) rein. Hier wurde ein Action-Button benutzt, welchen du dir als Vorlage rauskopieren kannst.

Ein Action-Button sieht etwa so aus:

[ACTION]
Text:Zur Startseite
Href:$ROOT$
Icon:mycustomicon.svg
[/ACTION]

## Fixedlogos

Hierbei handelt es sich um den Ordner `usercontent/fixedlogos`. Hier befinden sich alle Logos und Favicons, welche auf der Seite angezeigt werden. Diese Dateien können durch das eigene Logo ersetzt werden. Achte dabei aber auf die Dateinamen und Endungen bzw. den Dateityp, da diese festgelegt sind.

## Icons und Bilder

Icons und Bilder können unter `usercontent/icons` und `usercontent/images` abgelegt werden. Icons können für Action-Buttons genutzt werden, indem man einfach nur den ganzen Dateinamen angibt (`Icon: mycustomicon.svg`). Bilder können durch eine ähnliche Angabe im Header einer Projektseite als Vorschaubild genutzt werden: `PreviewImage: mycustomimage.png`.

Hinweis: Fixedlogos, Icons und Images können immer über die absolute URL zugegriffen werden (`http://example.com/usercontent/images/mycustomimage.png`)