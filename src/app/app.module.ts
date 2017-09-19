import {NgModule} from "@angular/core";
import {IonicApp, IonicModule, Platform} from "ionic-angular";
import {CloudModule, CloudSettings, Push} from "@ionic/cloud-angular";
import {BrowserModule} from '@angular/platform-browser';
import {SplashScreen} from "@ionic-native/splash-screen";
import {StatusBar} from "@ionic-native/status-bar";

import {Agendapp} from "./app.component";
import {CdtPage} from "../pages/cdt/cdt";
import {TabsPage} from "../pages/tabs/tabs";
import {CommModal} from "../pages/cdt/comm";
import {NotificationService} from "../services/notification.service";
import {NouveauPage} from "../pages/nouveau/nouveau";
import {UserPage} from "../pages/user/user";
import {LoginPage} from "../pages/login/login";
import {GroupesModal} from "../pages/user/groupes";
import {SyncService} from "../services/sync.service";
import {ColorModal} from "../pages/user/colorpicker";
import {PushService} from "../services/push.service";
import {AppPushService} from "../services/push-app.service";
import {WebPushService} from "../services/push-web.service";
import {HttpModule} from "@angular/http";


const cloudSettings: CloudSettings = {
  'core': {
    'app_id': 'a2b61f62'
  },
  'push': {
    'sender_id': '995041254191',
    'pluginConfig': {
      'ios': {
        'badge': true,
        'sound': true
      },
      'android': {
        'iconColor': '#7C4DFF'
      }
    }
  }
};

export function pushFactory(_notif: NotificationService, _push: Push, _platform: Platform): PushService {
  if (_platform.is("cordova"))
    return new AppPushService(_push, _notif);
  else
    return new WebPushService(_notif);
}

@NgModule({
  declarations: [
    Agendapp,
    CdtPage,
    NouveauPage,
    UserPage,
    LoginPage,
    TabsPage,
    CommModal,
    GroupesModal,
    ColorModal
  ],
  imports: [
    HttpModule,
    BrowserModule,
    IonicModule.forRoot(Agendapp),
    CloudModule.forRoot(cloudSettings)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Agendapp,
    CdtPage,
    NouveauPage,
    UserPage,
    LoginPage,
    TabsPage,
    CommModal,
    GroupesModal,
    ColorModal
  ],
  providers: [
    NotificationService,
    SyncService,
    {
      provide: PushService,
      useFactory: pushFactory,
      deps: [NotificationService, Push, Platform]
    },
    SplashScreen,
    StatusBar
  ]
})
export class AppModule {
}
