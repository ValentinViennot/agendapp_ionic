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
import {User} from "../../concepts/user";
import {NotificationService} from "../../services/notification.service";
import {SyncService} from "../../services/sync.service";
import {GroupesModal} from "./groupes";
import {ModalController} from "ionic-angular";
import {PushService} from "../../services/push.service";

@Component({
  selector: 'page-user',
  templateUrl: 'user.html',
  providers: [
    ParseService,
    FormBuilder
  ]
})
export class UserPage {

    user:User;
    fr:any;

    // Observer les changements
    changed:boolean;
    userForm:FormGroup;

    push_value:string;
    push:boolean;

    hours:number[]; // heures de rappel

    constructor(
        public _notif: NotificationService,
        public _sync: SyncService,
        public _push: PushService,
        private _parse: ParseService,
        private formBuilder: FormBuilder,
        public modalCtrl: ModalController
    ) {
        this.hours = Array.from(Array(24).keys());
        this.user = this._parse.parse("user");
    }

    ngOnInit():void {
        // Mise à zéro du formulaire
        this.initForm();
        // Rechargement des données distantes
        this.init(false);
    }

    ngOnDestroy():void {
      this.save();
    }

    /**
     * Initialisation du formulaire à partir des données utilisateur distantes
     * @param sync L'initialisation intervient elle après un enregistrement des données ?
     */
    private init(sync:boolean):void {
      if (sync) this._notif.add(0,'Modifications enregistrées','');
      else console.log("init user");
      this._sync.syncUser().then(
          value => this.initForm(),
          erreur => this._notif.add(
              2, 'Problème de synchronisation',
              'Impossible de récupérer les données (' + erreur + ')')
      );
    }

    /**
     * Initialisation du formulaire à partir des données utilisateur locales
     */
    private initForm():void {
      this.changed=false;
      this.push=this._push.isActivated();
      this._push.getPushToken().then(
        (token)=>this.push_value=token
      );
      this.user = this._parse.parse("user");
      this.userForm = this.formBuilder.group({
        'prenom': new FormControl(this.user.prenom, Validators.required),
        'nom': new FormControl(this.user.nom, Validators.required),
        'email': new FormControl(this.user.email, [Validators.required, Validators.pattern("([a-zA-Z0-9_.]{1}[a-zA-Z0-9_.]*)((@[a-zA-Z]{2}[a-zA-Z]*)[\\\.]([a-zA-Z]{2}|[a-zA-Z]{3}))")]),
        'mdp1': new FormControl('', [Validators.required, Validators.minLength(6)]),
        'mdp2': new FormControl('', [Validators.required, Validators.minLength(6)]),
        'mail': new FormControl(this.user.mail),
        'notifs': new FormControl(this.user.notifs),
        'rappels': new FormControl(this.user.rappels),
        'push': new FormControl(this.push)
      });
      this.userForm.valueChanges
        .subscribe(form => this.changed=true);
    }

    public save():void {
        if (this.userForm.value.mdp1==this.userForm.value.mdp2) {
          let infos:any = this.userForm.value;
          infos.push=this.push_value; // TODO MAJ APi to handle push and CRON (lié à token + cascade)
          this._sync.saveUser(infos).then(
              result => this.init(true),
              erreur => this._notif.add(2,'Erreur',erreur)
          );
        } else {
            this._notif.add(1,'Les mots de passe ne correspondent pas','');
        }
    }

    public presentGroupes():void {
      let groupesModal = this.modalCtrl.create(GroupesModal);
      groupesModal.present()
        .then(()=>{console.log("Navigation vers les groupes");})
        .catch(erreur=>{
          console.log(erreur);
          this._notif.add(2,"Erreur","Impossible de naviguer dans les groupes pour le moment. Essaie de fermer puis de réouvrir l'applicatin.");
        });
    }

    public setPush():void {
      // ne pas prendre en compte l'initialisation auto
      if (this.changed) {
        console.log("Trying to set Push");
        if (!this.push) this._notif.add(1,"Notifications Push","Le choix effectué n'est valable que pour cette session, sur cet appareil.");
        else this._notif.add(0,"Désactivation des notifications push...","");
        this._push.registerPush().then(
          () => this.init(false)
        ).catch(
          (erreur)=>this._notif.add(2,"Erreur",erreur)
        );
      }
    }
}
