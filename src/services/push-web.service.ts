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
import {Injectable} from "@angular/core";
import {PushService} from "./push.service";
import {NotificationService} from "./notification.service";
import firebase from "firebase/app";
import "firebase/messaging";

/**
 * Created by Valentin on 26/02/2017.
 * import * as firebase from "firebase/app";
 * import "firebase/messaging";
 */

@Injectable()
export class WebPushService extends PushService {

  app: firebase.app.App;
  messaging: firebase.messaging.Messaging;

  constructor(_notif: NotificationService) {
    super(_notif);
    console.log("Service de notifications push : Web");
    this.app = null;
    this.messaging = null;
  }

  initPush(): void {
    // Si les notifications sont activées et qu'une initialisation n'a pas déjà eu lieu auparavant
    if (this.isActivated()) {
      console.log("Initialisation de Firebase Cloud Messaging...");
      this.initFCM();
    } // Sinon on n'initialise pas le service
  }

  /**
   * Initialisation de l'application Firebase
   */
  private initFCM(): void {
    if (this.messaging == null || this.app == null) {
      let config = {
        apiKey: "AIzaSyDdwbqRLWBzAHyKTc4NsHQgFsb6HJIYLNM",
        authDomain: "agendapp-6f92b.firebaseapp.com",
        databaseURL: "https://agendapp-6f92b.firebaseio.com",
        storageBucket: "agendapp-6f92b.appspot.com",
        messagingSenderId: "995041254191"
      };
      this.app = firebase.initializeApp(config);
      this.messaging = firebase.messaging();
    }
  }

  registerPush(): Promise<string> {
    // Premier cas : l'utilisateur est déjà enregistré
    if (this.isActivated()) {
      // Dans ce cas, on le désenregistre
      return this.getPushToken()
        .then(
          (token) => {
            this.setActivated(false);
            return token;
          }
        );
      //return Promise.reject("Tu dois passer par les paramètres de ton navigateur pour désactiver les notifications. Si tu ne sais pas comment faire : Déconnecte puis reconnecte toi à l'Agendapp.");
    }
    // Deuxième cas : l'utilisateur n'est pas encore enregistré
    else {
      // Dans ce cas, on l'enregistre
      this.initFCM();
      return new Promise(
        (resolve, reject) => {
          // On demande la permission de notifier à l'utilisateur
          this.messaging.requestPermission()
            .then(() => {
              // Autorisation accordée
              console.log("Autorisation de notifier accordée.");
              // On demande alors le token
              this.getPushToken().then(
                (token) => {
                  // Activation si réussite
                  this.setActivated(true);
                  resolve(token);
                }
              ).catch((err) => {
                console.log(err);
                reject("Impossible d'enregistrer l'appareil... Essaie d'effacer les données de navigation puis de te reconnecter à l'Agendapp.");
              });
            })
            .catch((err) => {
              // Autorisation refusée
              console.log("Autorisation de notifier refusée.", err);
              // L'appareil n'a pas pu être inscrit
              reject("Autorisation de notifier refusée");
            });
        }
      );
    }
  }

  getPushToken(): Promise<string> {
    if (this.isActivated()) {
      return new Promise((resolve, reject) => {
        this.messaging.getToken().then(
          (token) => resolve("F" + token)
        ).catch(
          () => {
            // dans le cas où le token ne serait pas récupérable
            // mais que l'utilisateur aurait à priori activé les notifications
            // il pourrait avoir désactivé les notifications depuis les paramètres de son navigateur
            this.setActivated(false);
            this._notif.ask(
              "Petit problème...",
              "Les notifications push sont activées dans tes paramètres mais semble être désactivées dans ton navigateur.",
              "Réactiver",
              "Désactiver"
            ).then(
              () => {
                this.registerPush().then(
                  (token) => {
                    this._notif.add(0, "Ok !", "Les notifications seront bientôt actives...");
                    resolve("F" + token);
                  }
                ).catch(
                  (erreur) => {
                    this._notif.add(2, "Impossible de réactiver les notifications", erreur);
                    reject(erreur);
                  }
                );
              }
            ).catch(
              () => {
                this._notif.add(0, "Choix enregistré !", "");
                resolve("");
              }
            );
          }
        );
      });
    } else
      return Promise.resolve("");
  }
}
