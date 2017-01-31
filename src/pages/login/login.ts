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
import {Component} from "@angular/core";
import {FormGroup, Validators, FormControl, FormBuilder} from "@angular/forms";
import {ParseService} from "../../services/parse.service";
import {NotificationService} from "../../services/notification.service";
import {NavController} from "ionic-angular";
import {SyncService} from "../../services/sync.service";
import {TabsPage} from "../tabs/tabs";

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  providers: [
    ParseService,
    FormBuilder
  ]
})
export class LoginPage {

  regexp="([a-zA-Z0-9_.-]{1}[a-zA-Z0-9_.-]*)((@[a-zA-Z-]{2}[a-zA-Z-]*)[\\\.]([a-zA-Z]{2}|[a-zA-Z]{3}))";

  fr: any;

  loginForm:FormGroup;

  pending:any;

  constructor(
    private _notif:NotificationService,
    private _sync:SyncService,
    private _parse:ParseService,
    private navCtrl: NavController,
    private formBuilder:FormBuilder
  ) {
  }

  ngOnInit():void {
    this.loginForm = this.formBuilder.group({
      'email': new FormControl('', [Validators.required, Validators.pattern(this.regexp)]),
      'mdp': new FormControl('', Validators.required)
    });
    this.pending = {
      pendADD: this._parse.parse("pendADD"),
      pendALERT: this._parse.parse("pendALERT"),
      pendCOMM: this._parse.parse("pendCOMM"),
      pendDEL: this._parse.parse("pendDEL"),
      pendDELc: this._parse.parse("pendDELc"),
      pendDO: this._parse.parse("pendDO"),
      pendFLAG: this._parse.parse("pendFLAG"),
      pendMERGE: this._parse.parse("pendMERGE")
    }
  }

  public login():void {
    if (this.loginForm.value.email.match(this.regexp)) {
      if (this.loginForm.value.mdp.length>3) {
        this._sync.getToken(this.loginForm.value).then(
          response => this.token(response),
          erreur => this._notif.add(2,'Erreur',erreur)
        );
      } else {
        this._notif.add(1,'Mot de passe non valide','');
      }
    } else {
      this._notif.add(1,'Email non valide !','');
    }
  }

  private token(response:any):void {
    let th:any = this;
    if (response.token) {
      this._notif.add(0,'Connexion en cours...','');
      // Et on l'applique aux urls des apis
      this._sync.login(response.token);
      // On initialise les variables stockant les devoirs
      window.localStorage.setItem("devoirs","[]");
      window.localStorage.setItem("archives","[]");
      window.localStorage.setItem("version","0");
      this._sync
        .syncUser() // On récupère le profil de l'utilisateur
        .then(
          result => this._sync.getDevoirsIf("devoirs"),
          erreur => Promise.reject(erreur)
        )
        .then(
          result => this._sync.getDevoirsIf("archives"),
          erreur => Promise.reject(erreur)
        )
        .then(
          function () {
            th._notif.msgs = [];
            if (response.message)
              th._notif.add(0,response.message,'');
            // On enregistre le token reçu dans le navigateur du client
            window.localStorage.setItem("token", response.token);
            th.navCtrl.push(TabsPage).then(
              succes=>console.log("Login réussi !"),
              erreur=>this._notif.add(2,"Erreur","Redirection impossible ("+erreur+")")
            )
          },
          erreur => this._notif.add(2,'Erreur',erreur)
        );
    }
    else if (response.message) {
      this._notif.add(1,'Erreur de connexion',response.message);
    }
  }

  public ready():boolean {
    return this.loginForm.value.email.match(this.regexp)&&this.loginForm.value.mdp.length>3;
  }

  public clear():void {
    window.localStorage.clear();
    this.pending = null;
  }

  public isActions():string {
    if (this.pending!=null) {
      let actions = "";
      if (this.pending.pendADD!=null&&this.pending.pendADD.length>0) {
        actions+=this.pending.pendADD.length+" devoir(s) ajouté(s)";
      }
      if (this.pending.pendALERT!=null&&this.pending.pendALERT.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendALERT.length+" signalement(s)";
      }
      if (this.pending.pendCOMM!=null&&this.pending.pendCOMM.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendCOMM.length+" commentaire(s)";
      }
      if (this.pending.pendDEL!=null&&this.pending.pendDEL.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendDEL.length+" devoir(s) supprimé(s)";
      }
      if (this.pending.pendDELc!=null&&this.pending.pendDELc.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendDELc.length+" commentaire(s) supprimé(s)";
      }
      if (this.pending.pendDO!=null&&this.pending.pendDO.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendDO.length+" marqué(s) comme fait(s)";
      }
      if (this.pending.pendFLAG!=null&&this.pending.pendFLAG.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendFLAG.length+" marqueur(s)";
      }
      if (this.pending.pendMERGE!=null&&this.pending.pendMERGE.length>0) {
        if (actions.length>0) actions+=", ";
        actions+=this.pending.pendMERGE.length+" fusion(s) de devoirs";
      }
      if (actions.length==0) actions = null;
      return actions;
    } else {
      return null;
    }
  }

  inscription():void {
    window.location.href="http://agendapp.fr/inscription/";
  }
}
