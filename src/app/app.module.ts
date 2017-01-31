import {NgModule} from "@angular/core";
import {IonicApp, IonicModule} from "ionic-angular";
import {MyApp} from "./app.component";
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
import {CloudSettings, CloudModule} from "@ionic/cloud-angular";

const cloudSettings: CloudSettings = {
  'core': {
    'app_id': '1095e1fe'
  }
};

@NgModule({
  declarations: [
    MyApp,
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
    IonicModule.forRoot(MyApp),
    CloudModule.forRoot(cloudSettings)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
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
    SyncService
  ]
})
export class AppModule {}
