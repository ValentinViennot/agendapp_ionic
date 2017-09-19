import {Component} from "@angular/core";
import {Platform} from "ionic-angular";
import {SplashScreen} from '@ionic-native/splash-screen';
import {StatusBar} from '@ionic-native/status-bar';

import {TabsPage} from "../pages/tabs/tabs";
import {LoginPage} from "../pages/login/login";
import {SyncService} from "../services/sync.service";
import {PushService} from "../services/push.service";


@Component({
  template: `
    <ion-nav [root]="rootPage"></ion-nav>`
})
export class Agendapp {

  rootPage: any;

  constructor(
              private platform: Platform,
              private statusBar: StatusBar,
              private splashScreen: SplashScreen,
              _sync: SyncService,
              _push: PushService
  ) {
    platform.ready().then(() => {
      if (!window.localStorage.getItem("token") || !window.localStorage.getItem("user"))
        this.rootPage = LoginPage;
      else {
        _sync.login(window.localStorage.getItem("token"));
        this.rootPage = TabsPage;
      }
      if (platform.is('cordova')) {
        this.statusBar.styleDefault();
        this.splashScreen.hide();
        /*
        TODO réactiver après résolution du bug avec deploy et production...(penser à inclure deploy:Deploy dans le constructeur)
        //deploy.channel = "dev";
        deploy.channel = "production";
        deploy.check().then((snapshotAvailable: boolean) => {
          if (snapshotAvailable) {
            deploy.download().then(() => {
              deploy.extract().then(
                ()=>{
                  _notif.add(0,"Application mise à jour !","Les changements seront visibles au prochain lancement");
                }
              );
            });
          }
          deploy.getSnapshots().then((snapshots) => {
           snapshots.forEach(function(snapshot){
             switch (snapshot) {
               /!*case '3147de5c-fb72-11e6-b510-6e0c68722e02':
                 deploy.deleteSnapshot(snapshot).then(()=>console.log(snapshot+" snapshot deleted."));
                 break;*!/
             }
           });
          });
        });*/
      } else {
        console.warn("Cordova is not available.");
      }
      _push.initPush();
    });
  }

}
