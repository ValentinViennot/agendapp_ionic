import {Component} from "@angular/core";
import {Platform} from "ionic-angular";
import {StatusBar, Splashscreen} from "ionic-native";
import {TabsPage} from "../pages/tabs/tabs";
import {LoginPage} from "../pages/login/login";
import {SyncService} from "../services/sync.service";
import {Deploy} from "@ionic/cloud-angular";
import {NotificationService} from "../services/notification.service";


@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {

  rootPage:any;

  constructor(
    platform: Platform,
    _sync: SyncService,
    _notif: NotificationService,
    deploy: Deploy
  ) {
    platform.ready().then(() => {
      if (!window.localStorage.getItem("token") || !window.localStorage.getItem("user"))
        this.rootPage = LoginPage;
      else {
        _sync.login(window.localStorage.getItem("token"));
        this.rootPage = TabsPage;
      }
      if (platform.is('cordova')) {
        StatusBar.styleDefault();
        Splashscreen.hide();
        deploy.channel = "production";
        deploy.check().then((snapshotAvailable: boolean) => {
          if (snapshotAvailable) {
            deploy.download().then(() => {
              deploy.extract().then(
                on=>{
                  _notif.add(0,"Application mise à jour !","Les changements seront visibles au prochain lancement");
                }
              );
            });
          }
          /*deploy.getSnapshots().then((snapshots) => {
           snapshots.forEach(function(snapshot){
             switch (snapshot) {
              // TODO delete old snapshot (case 'uuid': deploy.deleteSnapshot(snapshot))
             }
             });
           });*/
        });

      } else {
        console.warn("Deploy not initialized. Cordova is not available - Run in physical device");
      }
      // Initialisation du service d'envoi de notifications push
      _notif.initPush();
    });
  }
}
