# agendacollaboratif_app

    "AGENDAPP - l'Agenda Collaboratif"
    Copyright (C)  2016  Valentin VIENNOT
    Contact : vviennot@orange.fr
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    You have to put a copy of this program's license into your project.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    
    FULL LICENSE FILE : https://github.com/misterw97/agendacollaboratif_app/edit/master/LICENSE


VERSION APPLICATION WEB IONIC - 3.0.0-rc.2

Comment démarrer depuis une copie de ce github ? 

in agendacollaboratif_app folder.. run cmd :
npm install -g cordova && npm install -g ionic
ionic start agendapp GITHUBLINK/src --v2
cd agendapp
// copier le dossier resources depuis github
// copier et remplacer les fichiers :
// - bower.json
// - .io-config.json
// - config.xml
// - ionic.config.json
// - LICENSE
// - package.json
npm install && npm update
ionic serve
// Pour ajout de platformes
// Installer le Android SDK
ionic platform add android
ionic resources & ionic resources
ionic build android
// Après connexion d'un appareil android en USB
ionic run android

Description

Le projet "l'Agenda Collaboratif" offre un espace et des fonctionnalités pour partager des informations sur les devoirs / exercices et choses à faire liées à l'école. L'objectif est de permettre aux étudiants de collaborer sur leurs devoirs et d'être facilement informés de ce qu'ils ont à faire pour les jours suivants. En outre, d'autres fonctionnalités sont et seront progressivement ajoutées pour rendre l'interface plus facile et plus riche. Par exemple, les étudiants peuvent désormais marquer un exercice comme «fait» pour avoir un aperçu rapide de ce qu'ils ont accompli et de ce qui leur reste à faire, ou, autre exemple, ils ont la possibilité d'ajouter et activer des rappels sur les événements et sur les devoirs non fait du lendemain.

  REMARQUE
  Les projets présentés sur GitHub ne sont que les versions "client" (frontend) web et mobile (app/ionic). Le projet ne peut fonctionner sans un accès aux APIS présentes sur le serveur (backend).

Tout développeur est invité à collaborer / modifier sur ce projet dans les termes de la license à laquelle il est soumise.
https://github.com/misterw97/agendacollaboratif/edit/master/LICENSE
Merci de me contacter pour de plus amples informations et, si vous le souhaitez, pour apporter votre collaboration.

Valentin VIENNOT
vviennot@orange.fr
