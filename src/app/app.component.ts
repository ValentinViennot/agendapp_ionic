import {Component} from "@angular/core";
import {Platform} from "ionic-angular";
import {StatusBar, Splashscreen} from "ionic-native";
import {TabsPage} from "../pages/tabs/tabs";
import {LoginPage} from "../pages/login/login";
import {SyncService} from "../services/sync.service";


@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {

  rootPage:any;

  constructor(
    platform: Platform,
    _sync: SyncService
  ) {
    platform.ready().then(() => {
      if (!window.localStorage.getItem("token") || !window.localStorage.getItem("user"))
        this.rootPage = LoginPage;
      else {
        _sync.login(window.localStorage.getItem("token"));
        this.rootPage = TabsPage;
      }
      StatusBar.styleDefault();
      Splashscreen.hide();
    });
  }
}
