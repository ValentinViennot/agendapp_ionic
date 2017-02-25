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
import {ToastController, AlertController, Platform} from "ionic-angular";
import {Push, PushToken} from "@ionic/cloud-angular";
import {isUndefined} from "ionic-angular/util/util";
import * as firebase from "firebase/app";
import "firebase/messaging";

@Injectable()
export class NotificationService {

  app:firebase.app.App;
  messaging:firebase.messaging.Messaging;

  constructor (
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public push: Push,
    public platform: Platform
  ) {
    this.app=null;
    this.messaging=null;
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

  /**
   * Initialisation du service Push
   */
  public initPush():void {
      // Notifications sur mobile
      if (this.platform.is("cordova")) {
        this.getPushToken().then((token)=>{
          // Si l'appareil a déjà été enregistré auparavant...
          if (token!=null) {
            // Si l'appareil est correctement enregistré
            if (this.push.token.registered) {
              // En cas de réception d'une notification lorsque l'application est ouverte
              this.push.rx.notification()
                .subscribe((msg) =>
                  // On affiche la notification push comme un toast
                  this.add(0, msg.title, msg.text));
              console.log("Les notifications push sont correctement activées sur cet appareil !");
            } // Sinon, si l'appareil est mal enregistré, on le réenregistre
            else {
              console.log("Réactivation des notifications push...");
              // Puis on relance l'initialisation
              this.registerPush().then(token=>this.initPush());
            }
          }
          // Sinon, les notifications push ne sont pas activées
        });
      }
      // Notifications navigateur
      else {
        this.getPushToken().then(()=>{
          if (
            this.messaging==null||this.app==null||isUndefined(this.messaging)||isUndefined(this.app)
          ) {
            console.log("init Firebase Cloud Messaging");
            let config = {
              apiKey: "AIzaSyDdwbqRLWBzAHyKTc4NsHQgFsb6HJIYLNM",
              authDomain: "agendapp-6f92b.firebaseapp.com",
              databaseURL: "https://agendapp-6f92b.firebaseio.com",
              storageBucket: "agendapp-6f92b.appspot.com",
              messagingSenderId: "995041254191"
            };
            this.app = firebase.initializeApp(config);
            this.messaging = firebase.messaging();
            let th:any=this;
            this.messaging.onTokenRefresh(function() {
              th.messaging.getToken()
                .then(function(refreshedToken) {
                  console.log('Token refreshed.');
                  // TODO send to server ???
                })
                .catch(function(err) {
                  console.log('Unable to retrieve refreshed token ', err);
                });
            });
          }
        });
      }
    }

  /**
   * Permet d'enregistrer, de ré enregistrer ou de desenregistrer l'appareil des notifications push selon la situation
   * @return Promise<string> Push Token (ancien si désinscription), null si erreur
   */
  public registerPush():Promise<string> {
    let th:any = this;
    // Notifications sur mobile
    if (this.platform.is("cordova")) {
      return this.getPushToken().then(
        (token)=>{
          // Si l'appareil n'est pas encore enregistré ou pas correctement
          if (token==null||!this.push.token.registered) {
            // Alors on l'enregistre (créé un nouveau token si non existant)
            return this.push.register()
              .then(
                (t: PushToken) => {
                  return th.push.saveToken(t);
                }
              ).then(
                (t: PushToken) => {
                  console.log("Appareil inscrit aux notifications Push !");
                  // Renvoi le token d'inscription aux notifications PUSH
                  return t.token;
                }
              ).catch(
                // En cas d'erreur, l'appareil peut être hors connexion auquel cas ce n'est pas grave
                // Mais il peut aussi il y avoir eu une erreur d'enregistrement... on renvoit donc NULL
                erreur => {
                  console.log(erreur);
                  return null;
                }
              );

        } // Si l'appareil est déjà correctement enregistré, alors on le désinscrit et on renvoit l'ancien token
        else {
            return this.push.unregister().then(
              () => {
                let old_token:string=this.push.token.token;
                console.log("Appareil désinscrit des notifications push.");
                this.push.token=null;
                return old_token;
              }
            ).catch(
              erreur => {
                console.log(erreur);
                return null;
              }
            );
          }
        }
      ).catch((err) => {console.log(err);return null});
    }
    // Notifications navigateur
    else {
      return this.getPushToken().then((token)=>{
        // Si l'utilisateur n'est pas (ou plus) inscrit aux notifications, on l'y inscrit
        if (token==null) {
          return this.messaging.requestPermission()
            .then(() => {
              console.log('Notification permission granted.');
              return this.getPushToken().then(
                (token)=>{
                  return token;
                }
              ).catch((err)=>{
                console.log(err);
                return null;
              });
            })
            .catch((err) => {
              console.log('Unable to get permission to notify.', err);
              return null;
            });
        } else {
          this.messaging.deleteToken(token);
          return null;
        }
      }).catch((err)=>{console.log(err);return null;});
    }
  }

  /**
   * Vérifie si l'appareil est inscrit aux notifications
   * @return {string} Push Token si inscrit ou null si non inscrit
   */
  public getPushToken():Promise<string> { // TODO (Rajouter un entête concernant le type de token ? ex ('I'+token))
    if (!isUndefined(this.push.token))
      return Promise.resolve("I"+this.push.token.token);
    else if (this.messaging!=null&&!isUndefined(this.messaging)) {
      return new Promise((resolve,reject) => {
        this.messaging.getToken().then(
          (token) => resolve("F"+token)
        ).catch(() =>
          resolve(null)
        );
      });
    }
    else
      return Promise.resolve(null);
  }

}
