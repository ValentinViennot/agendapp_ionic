import { Component } from '@angular/core';
import {CdtPage} from "../cdt/cdt";
import {NouveauPage} from "../nouveau/nouveau";

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root:any = CdtPage;
  archiveParams = {
    type: "archives"
  };
  tab2Root:any = NouveauPage;
  /*tab2Root: any = AboutPage;
  tab3Root: any = ContactPage;*/

  constructor() {

  }
}
