 /*
  "l'Agenda Collaboratif"
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

  FULL LICENSE FILE : https://github.com/misterw97/agendacollaboratif/edit/master/LICENSE
  */
 import {Commentaire} from "./commentaire";
 import {PJ} from "./PJ";

 export class Devoir {
     // Identité
     id: number; // Référence du devoir en BDD
     user: number; // Référence de l'utilisateur en BDD
     // Dates
     date: Date;
     // Contenu
     auteur: string; // prenomnom de l'auteur
     matiere: string; // Nom de la matiere
     matiere_c:string; // Classe couleur associée à la matiere
     texte: string; // Description
     nb_fait: number; // Combien l'ont fait
     // Infos personnalisées
     fait: boolean; // Propre à l'utilisateur
     flag: number; // Priorité du devoir
     // Objets liés
     pjs: PJ[];
     commentaires: Commentaire[];
 }