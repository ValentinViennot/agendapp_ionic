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
import {ParseService} from "../../services/parse.service";
import {DateService} from "../../services/date.service";
import {Devoir} from "../../concepts/devoir";
import {NavParams, ViewController} from "ionic-angular";
import {Commentaire} from "../../concepts/commentaire";
import {User} from "../../concepts/user";
import {NotificationService} from "../../services/notification.service";

/**
* Affichage des commentaires du devoir passé en paramètre
*/
@Component({
  selector: 'mod-comm',
  templateUrl: 'comm.html',
  providers: [
   ParseService,
   DateService
  ]
})
export class CommModal {
  /**
   * Devoir à afficher
    */
 devoir:Devoir;
 user:User;
 input:string;

 constructor(
   private _parse:ParseService,
   private _notif: NotificationService,
   private params: NavParams,
   private viewCtrl: ViewController,
   public _date: DateService
 ) {
   this.input="";
   if (!window.localStorage.getItem("pendCOMM"))
     window.localStorage.setItem("pendCOMM", JSON.stringify([]));
   // Récupère l'utilisateur actuel depuis le localStorage
   this.user = this._parse.parse("user");
   // Récupère le devoir passé en paramètre
   this.devoir=params.get('devoir');
 }

  /**
   * Fermeture de la fenêtre modale
   */
  private dismiss() {
    this.viewCtrl.dismiss().then(
      succes=>console.log("commentaires fermés."),
      erreur=>this._notif.add(1,"Erreur",erreur)
    );
  }

  /**
   * Supprime le commentaire
   * @param commentaire à supprimer
   */
  supprimer_comm(commentaire:Commentaire):void {
    // On supprime le commentaire du devoir concerné
    this.devoir.commentaires.splice(
      (this.devoir.commentaires).indexOf(commentaire),
      1
    );
    // On ajoute l'opération en liste d'attente
    this.pend("DELc",commentaire.id);
  }

  /**
   * Envoi d'un commentaire
   */
  sendComment() {
    if (this.input.length>3) {
      // Création du commentaire
      let commentaire:Commentaire = {
        "id":0,
        "user":this.user.id,
        "auteur":this.user.prenom+this.user.nom,
        "date": new Date(),
        "texte": this.input,
        "pjs": null
      };
      // On ajoute le commentaire au devoir
      this.devoir.commentaires.splice(this.devoir.commentaires.length,0,commentaire);
      // Ajout à la liste d'attente
      this.pend("COMM", {"id":this.devoir.id,"content":commentaire});
      this.input="";
    } else {
      this._notif.add(1,'Commentaire trop court !','minimum : 4 caractères');
    }
    this.dismiss();
  }

  pend(list:string, push:any):void {
    // Ajoute l'opération à la liste d'attente du suppression de commentaires
    let pending=JSON.parse(window.localStorage.getItem("pend"+list));
    pending.push(push);
    window.localStorage.setItem("pend"+list, JSON.stringify(pending));
  }

  /*tofileComm(event,devoir: Devoir, comm:Commentaire,overlaypanel: OverlayPanel) {
   this.fileComm=comm;
   this.selectedComm=devoir;
   this.selectedDevoir = null;
   overlaypanel.toggle(event);
   }*/
  tofileComm() {}

}
