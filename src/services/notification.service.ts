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
/**
 * Service d'envoi de notifications / alertes à l'utilisateur
 * Created by Valentin on 17/07/2016.
 */
import {Injectable} from "@angular/core";
import {ToastController, AlertController} from "ionic-angular";

@Injectable()
export class NotificationService {

  constructor (
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
  }

  /**
   * Ajout d'une notification
   * @param level [0,1,2] = [Info,Warn,Erreur] = [Toast, PopUp, PopUp]
   * @param titre Titre du message(phrase courte)
   * @param message Contenu de la notification (Peut être laissé vide)
   */
  public add(level:number, titre:string, message:string):void {
    if (level==0) {
      let toast = this.toastCtrl.create({
        message: titre+(message.length>0?(' - '+message):''),
        duration: 3500,
        position: 'top'
      });
      toast.present()
        .then(()=>console.log("Notification toast ajoutée!"))
        .catch(erreur=>console.log(erreur));
    } else {
      let alert = this.alertCtrl.create({
        title: titre,
        subTitle: message,
        buttons: ['Ok']
      });
      alert.present()
        .then(()=>console.log("Notification ajoutée !"))
        .catch(erreur=>console.log(erreur));
    }
  }

  /**
   * Ajout d'une notification posant une question à l'utilisateur
   * @param titre Titre de la notification
   * @param message Contenu de la notification
   * @param confirmer Texte du bouton de confirmation
   * @param annuler Texte du bouton de refus
   * @return {Promise<>} Resolve si confirmé, Reject si annulé
   */
  public ask(titre:string, message:string, confirmer:string, annuler:string):Promise<any> {
    let th:any = this;
    return new Promise(
      function(resolve,reject) {
        let alert = th.alertCtrl.create({
          title: titre,
          message: message,
          buttons: [
            {
              text: annuler,
              role: 'cancel',
              handler: () => {
               reject("Annulé");
              }
            },
            {
              text: confirmer,
              handler: () => {
                resolve('ok');
              }
            }
          ]
        });
        alert.present()
          .then(()=>console.log("Notification de demande effectuée"))
          .catch(erreur=>console.log(erreur));
      }
    );
  }

}
