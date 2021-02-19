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
