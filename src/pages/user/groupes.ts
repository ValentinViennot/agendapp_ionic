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
import {ParseService} from "../../services/parse.service";
import {Component} from "@angular/core";
import {NotificationService} from "../../services/notification.service";
import {SyncService} from "../../services/sync.service";
import {ViewController, AlertController, PopoverController} from "ionic-angular";
import {Groupe} from "../../concepts/groupe";
import {User} from "../../concepts/user";
import {ColorModal} from "./colorpicker";

@Component({
  selector: 'mod-groupes',
  templateUrl: 'groupes.html',
  providers: [
    ParseService
  ]
})
export class GroupesModal {

  user:User;

  // Chemin d'accès au groupe en cours
  pathGroups:Groupe[];
  // Groupes (et matières) dans le groupe actuel
  groups:Groupe[];
  // Groupe actuel
  group:Groupe;
  // Groupe sélectionné (choix couleur)
  selectedGroup:Groupe;
  newGroup:Groupe;

  constructor(
    public _parse: ParseService,
    public _notif: NotificationService,
    public _sync: SyncService,
    public viewCtrl: ViewController,
    public alertCtrl: AlertController,
    public popoverCtrl: PopoverController
  ) {
    this.user = this._parse.parse("user");
    // Historique de navigation
    this.pathGroups = [];
  }

  ngOnInit():void {
    console.log("* GroupController *");
    if (!navigator.onLine) {
      this._notif.add(2,"Hors ligne","Pas de connexion à Internet");
      this.dismiss();
    }
    // Récupère la version la plus récente de l'utilisateur
    this._sync.syncUser().then(
      result => this.user = this._parse.parse("user"),
      erreur => console.log(erreur)
    );
    this.init();
  }

  private init():void {
    // Initialisation de l'historique
    this.pathGroups = [];
    // Définition de la racine : Etape de départ de la navigation
    this.group = new Groupe();
    this.group.id = this.user.root;
    this.group.parentid = this.user.root;
    this.group.nom = "Racine";
    this.group.parent = "Racine";
    this.group.type = 2;
    // Définir la racine comme groupe actuel de la navigation
    this.push(this.group);
  }

  /**
   * Récupération des groupes et matières du groupe en cours
   */
  private refresh():void {
    this.groups = null;
    console.log("Chargement de "+this.group.nom+"("+this.group.id+") ...");
    this._sync.getGroups(this.group.id).then(
      groupes => this.groups = groupes,
      erreur => this._notif.add(2,'Erreur','Impossible de récupérer les groupes et matières ('+erreur+')')
    );
  }

  public push(group:Groupe) {
    this.group = group;
    this.pathGroups.push(group);
    this.refresh();
  }

  private back(prev:number):void {
    if (this.pathGroups.length>=prev) {
      // On retient le groupe qui va être affiché (precedent)
      let group:Groupe = this.pathGroups[this.pathGroups.length-prev];
      // On enlève à l'historique le groupe actuel et le précédent
      this.pathGroups.splice(-prev,prev);
      // On ajoute à l'historique le groupe précédent qui devient l'actuel
      this.push(group);
    } else console.log("trop court !");
  }

  public toParent() {
    if (this.pathGroups.length>1) {
      // On remonte le groupe actuel et le précédent
      this.back(2);
    } else {
      // S'il n'y a plus qu'un élément c'est qu'on est revenu à la racine
      this.init();
    }
  }

  /**
   *
   * @param index dans pathGroups
   */
  public toGroup(index:number) {
    this.back(this.pathGroups.length-index);
  }

  public presentColorPicker(groupe:Groupe):void {
    let popover = this.popoverCtrl.create(ColorModal, { groupe:groupe });
    popover.onDidDismiss(() => {
      this.refresh();
    });
    popover.present();
  }

  public preCreateGroup(type:number) {
    this.selectedGroup = null;
    this.newGroup = new Groupe();
    this.newGroup.type = type;
    this.newGroup.parentid = this.group.id;
    this.newGroup.parent = this.group.nom;
    this.newGroup.isUser = true;
    let th:any=this;
    let prompt = this.alertCtrl.create({
      title: (type==1?'Nouveau dossier':'Nouvelle matière')+' (dans le dossier actuel)',
      message: "Choix d'un nom pour le nouveau groupe",
      inputs: [
        {
          name: 'Nom',
          placeholder: type==1?'Groupe 51, TS1, 6ème5...':'Mathématiques, Philosophie...'
        },
      ],
      buttons: [
        {
          text: 'Annuler',
          handler: data => {
            console.log("Création de groupe annulée");
          }
        },
        {
          text: 'Enregistrer',
          handler: data => {
            th.newGroup.nom = data.Nom;
            th.createGroup();
          }
        }
      ]
    });
    prompt.present();
  }

  public createGroup() {
    let th: any = this;
    this._sync.newGroup(this.newGroup).then(
      function () {
        th.newGroup = null;
        th.refresh();
      },
      erreur => this._notif.add(2, 'Erreur', erreur)
    );
  }

  /**
   * @param group à rejoindre
   */
  public join(group:Groupe):void {
    this._sync.joinCourse(group.id).then(
      result => this.refresh(),
      erreur => this._notif.add(2,'Erreur',erreur)
    );
  }

  /**
   *
   * @param group à quitter
   */
  public quit(group:Groupe):void {
    this._notif.ask('Confirmation','En quittant ce groupe tu quittes tous les groupes qu\'il contient et tu perds tes couleurs personnalisées. De plus, si plus personne n\'y est inscrit, il sera supprimé ainsi que tous les devoirs associés.','Compris !','Annuler')
      .then(
        oui => this._sync.quitCourse(group.id).then(
          result => this.refresh(),
          erreur => this._notif.add(2,'Erreur',erreur)
        ),
        non => this.refresh()
      );
  }

  /**
   * Fermeture de la fenêtre modale
   */
  public dismiss() {
    this.viewCtrl.dismiss();
  }

  help():void {
    this._notif.add(1,'Aide','Rejoindre un dossier t\'abonne à toutes les matières qu\'il contient. ' +
      'Rejoindre une matière t\'abonne à tous les dossiers parents de cette matière jusqu\'à la racine. ' +
      'Quitter un dossier te fait quitter toutes les matières qu\'il contient. ' +
      'Un groupe se supprime automatiquement quand plus personne n\'y est abonné. '
    );
  }
}
