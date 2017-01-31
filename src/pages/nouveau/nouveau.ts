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
import {Component} from "@angular/core";
import {NavController} from "ionic-angular";
import {User} from "../../concepts/user";
import {NotificationService} from "../../services/notification.service";
import {SyncService} from "../../services/sync.service";
import {ParseService} from "../../services/parse.service";
import {isUndefined} from "ionic-angular/util/util";
import {Devoir} from "../../concepts/devoir";
import {Groupe} from "../../concepts/groupe";
import {DateService} from "../../services/date.service";

@Component({
   selector: 'page-nouveau',
   templateUrl: 'nouveau.html',
   providers: [ParseService,DateService]
 })
 export class NouveauPage {
   /** Utilisateur connecté */
   user:User;

   date:string;
   matiere:string;
   texte:string;

   constructor(
     private navCtrl: NavController,
     private _notif:NotificationService,
     private _sync:SyncService,
     private _parse:ParseService,
     private _date:DateService
   ) {
     this.user = this._parse.parse("user");
     this.init();
   }

   ngOnInit():void {
     let th:any = this;
     this._sync.syncUser().then(
       result => this.user = this._parse.parse("user"),
       function (erreur:string) {
         if (window.localStorage.getItem("user"))
           th.user = th._parse.parse("user");
         else
           th._notif.add(
             2, 'Problème de synchronisation',
             'Impossible de récupérer les données (' + erreur + ')');
       }
     );
   }

   private init():void {
     this.date = this._date.today.toISOString();
     this.texte = null;
     this.matiere = null;
   }

   ngOnDestroy():void {
   }

   public save():void {
     // vérification des informationse entrées
     if (
       isUndefined(this.texte)
       ||isUndefined(this.date)
       ||isUndefined(this.matiere)
       ||this.texte==null
       ||this.texte.length<3
     ) {
       this._notif.add(1,'Champs requis','Il faut tout compléter avant de pouvoir enregistrer (matière, date et texte)');
     } else {
       // Récupération de la liste des devoirs existants
       let devoirs:Devoir[] = this._parse.parse("devoirs");
       // Création du nouveau devoir
       let devoir:Devoir = new Devoir();
       let matiere:Groupe = JSON.parse(this.matiere);
       devoir.texte = this.texte;
       devoir.matiere = matiere.nom;
       devoir.matiere_c = matiere.color;
       devoir.user = matiere.id;
       devoir.fait = false;
       devoir.nb_fait = 0;
       devoir.auteur = "moi";
       devoir.flag = 0;
       devoir.date = new Date(this.date);
       //devoir.date.setFullYear(+(this.date.substr(6,4)),(+this.date.substr(3,2)-1),+this.date.substr(0,2));
       devoir.date.setHours(20);devoir.date.setMinutes(0);devoir.date.setSeconds(0);
       // Ajout du devoir à la liste (bien positionné)
       let i:number;
       for (i =0; i<=devoirs.length; i++) {
         if (i==devoirs.length||devoir.date<=devoirs[i].date)
           break;
       }
       devoirs.splice(i,0,devoir);
       // Réécriture de la liste des devoirs locale
       window.localStorage.setItem("devoirs",JSON.stringify(devoirs));
       // Ajout à la liste des opérations en attente
       let pending = this._parse.parse("pendADD");
       pending.push(devoir);
       window.localStorage.setItem("pendADD",JSON.stringify(pending));
       // Réinitialisation du formulaire
       this.init();
       // Retour à la liste des devoirs à faire
       this.navCtrl.parent.select(0);
     }
   }

   public getCourseValue(course:Groupe):string {
     return JSON.stringify(course);
   }

 }
