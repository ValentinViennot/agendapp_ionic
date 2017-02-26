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
import {Push, PushToken} from "@ionic/cloud-angular";
import {isUndefined} from "ionic-angular/util/util";
import {Injectable} from "@angular/core";
import {NotificationService} from "./notification.service";
import {PushService} from "./push.service";

/**
 * Service d'envoi de notifications push à l'utilisateur
 * VERSION MOBILE Ionic Cloud Push
*/

@Injectable()
export class AppPushService extends PushService {

  constructor (
    public push: Push,
    public _notif: NotificationService
  ) {
    super(_notif);
    console.log("Service de notifications push : App");
  }

  /**
   * Initialisation du service Push
   */
  initPush():void {
    // Si l'utilisateur a activé les notifications
    if (this.isActivated()) {
      // Vérifions si son appareil est déjà correctement enregistré
      if (this.push.token.registered) {
        // dans ce cas, on peut directement prévoir un callback
        // callback pour les notifications reçues lorsque l'appli est ouverte
        this.push.rx.notification()
          .subscribe((msg) =>
            // On affiche la notification push comme un toast
            this._notif.add(0, msg.title, msg.text));
        console.log("Les notifications push sont correctement activées sur cet appareil !");
      } // Sinon, si l'appareil est mal enregistré, on le réenregistre
      else {
        console.log("Réactivation des notifications push...");
        // Puis on relance l'initialisation
        this.register().then(()=>this.initPush());
      }
    } // sinon , pas d'initialisation
  }

  /**
   * Enregistre l'appareil s'il n'est pas encore inscrit
   * Désenregistre l'appareil s'il est déjà inscrit
   * @return Promise<string> Jeton d'inscriptin (ancien dans le cas d'un désenregistrement)
   * Resolve si l'action demandée a été éffectuée
   * Reject sinon
   */
  registerPush():Promise<string> {
    if (this.isActivated()) {
      // désenregistrer l'appareil
      this.setActivated(false);
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
          return "Essaie à nouveau";
        }
      );
    } else {
      return this.register();
    }
  }

  private register():Promise<string> {
    // enregistre (créé un nouveau token si non existant)
    return this.push.register()
      .then(
        (t: PushToken) => {
          return this.push.saveToken(t);
        }
      ).then(
        (t: PushToken) => {
          this.setActivated(true);
          console.log("Appareil inscrit aux notifications Push !");
          // Renvoi le token d'inscription aux notifications PUSH
          return t.token;
        }
      );
  }

  /**
   * Vérifie si l'appareil est inscrit aux notifications
   * @return {string} Push Token si inscrit ou null si non inscrit
   */
  getPushToken():Promise<string> {
    if (!isUndefined(this.push.token)&&this.push.token.token!=null)
      return Promise.resolve("I"+this.push.token.token);
    else
      return Promise.resolve(null);
  }

}
