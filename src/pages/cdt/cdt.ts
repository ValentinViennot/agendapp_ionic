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
import {NavParams, AlertController, ModalController, NavController} from "ionic-angular";
import {SyncService} from "../../services/sync.service";
import {NotificationService} from "../../services/notification.service";
import {DateService} from "../../services/date.service";
import {ParseService} from "../../services/parse.service";
import {Invitation} from "../../concepts/invitation";
import {Devoir} from "../../concepts/devoir";
import {Section} from "../../concepts/section";
import {User} from "../../concepts/user";
import {IntervalObservable} from "rxjs/observable/IntervalObservable";
import {isUndefined} from "ionic-angular/util/util";
import {SelectItem} from "../../concepts/selectitem";
import {PJ} from "../../concepts/PJ";
import {CommModal} from "./comm";
import {UserPage} from "../user/user";

@Component({
 selector: 'page-cdt',
 templateUrl: 'cdt.html',
 providers: [
   ParseService,
   DateService
 ]
})
export class CdtPage {

  token:string;

  // Synchronisation auto régulière
  interval:any;
  // Sélection de la source à afficher
  type:string;

  // Utilisateur connecté
  user:User;

  // Devoirs
  devoirs: Devoir[];
  sections: Section[];
  // Merge
  merge: Devoir[];

  // Dynamisme
  selectedDevoir:Devoir;

  // Marqueurs
  flags:string[];
  flagsfr:string[];
  flags_count:number[];

  // Filtres
  /* filtrage ajouté par des fonctions */
  filtre:string;
  /* filtrage libre */
  filtre_texte:string;
  /** filtres applicables */
  filtres: SelectItem[];
  /* filtres appliqués */
  selectedFiltres:string[];
  /* filtrage permanent des devoirs marqués comme terminés */
  filtrdone:boolean;

  // invitations à des groupes
  invitations:Invitation[];

 constructor(
    public navCtrl: NavController,
    public params: NavParams,
    public  _sync: SyncService,
    public _notif: NotificationService,
    public _date: DateService,
    public _parse: ParseService,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
 ) {
   // Pour éviter le undefined, on initialise les tableaux vides
   this.devoirs = [];
   this.sections = [];
   this.invitations = [];
   // Initialisation de la liste de fusion (vide par défaut)
   this.merge = [];
   // Initialisation de la liste de marqueurs
   this.flags = ["grey", "blue", "orange", "red"];
   this.flagsfr = ["Gris", "Bleu", "Orange", "Rouge"];
   // Compteur de marqueurs par couleur
   this.flags_count = [0];
   // Aucun devoir sélectionné au départ pour les marqueurs
   this.selectedDevoir = new Devoir();
   // Initialisation des filtres
   this.filtres = [];
   this.filtre = "";
   this.filtre_texte = "";
   this.selectedFiltres = [];
 }

  ngOnInit():void {
    // Type de devoirs à afficher (archives ou devoirs)
    this.type = this.params.data.type;
    if(isUndefined(this.type)||this.type=="")
      this.type="devoirs";
    // Vérifie la connexion à Internet
    this._sync.checkConnection();
    // Initialise l'affichage des données (+ locales + récupération du serveur)
    this.init();
    // Récupération des demandes d'invitation à des nouveaux groupes
    if (this._sync.isOnline()) this.getInvitations();
 }

  ngOnDestroy() {
    // On détruit l'intervalle de synchro auto à la sortie de la page
    if (this.interval!=null) this.interval.unsubscribe();
  }

  private init():void {
    console.log("Initialisation...");
    let th:any=this;
    // Récupère le token d'identification (nécessaire)
    this.token = window.localStorage.getItem("token");
    // Récupère le filtre devoirs marqués comme faits ou non
    if (!window.localStorage.getItem("fd"+this.type))
      window.localStorage.setItem("fd"+this.type, JSON.stringify(false));
    this.filtrdone = JSON.parse(window.localStorage.getItem("fd"+this.type));
    // Récupère l'utilisateur actuel depuis le localStorage
    this.user = this._parse.parse("user");
    // Vérification de l'intégrité des pending list
    if (!window.localStorage.getItem("pendADD")) window.localStorage.setItem("pendADD", JSON.stringify([]));
    if (!window.localStorage.getItem("pendDEL")) window.localStorage.setItem("pendDEL", JSON.stringify([]));
    if (!window.localStorage.getItem("pendDELc")) window.localStorage.setItem("pendDELc", JSON.stringify([]));
    if (!window.localStorage.getItem("pendALERT")) window.localStorage.setItem("pendALERT", JSON.stringify([]));
    if (!window.localStorage.getItem("pendDO")) window.localStorage.setItem("pendDO", JSON.stringify([]));
    if (!window.localStorage.getItem("pendFLAG")) window.localStorage.setItem("pendFLAG", JSON.stringify([]));
    if (!window.localStorage.getItem("pendMERGE")) window.localStorage.setItem("pendMERGE", JSON.stringify([]));
    if (!window.localStorage.getItem("pendCOMM")) window.localStorage.setItem("pendCOMM", JSON.stringify([]));
    // Synchronisation auto des données (millisecondes) - PAS SUR LES ARCHIVES
    if (this.type=="devoirs")
      this.interval = IntervalObservable.create(20000).subscribe((t) => this.sync());
    else
    // SUR LES ARCHIVES - On force le téléchargement des données (sans MAJ de version)
      this._sync.getDevoirs(this.type).then(
        function (devoirs:Devoir[]) {
          window.localStorage.setItem(th.type, JSON.stringify(devoirs));
          console.log("Devoirs récupérées");
          th.refresh();
        },
        erreur => console.log(erreur)
      );
  }

  ionViewDidEnter():void {
    // affiche aussi rapidement que possible les données disponibles au localStorage
    this.refresh();
    if (this.type=="devoirs")
      this.sync();
  }

  /**
   * Synchronisation des données
   */
  private sync():void {
    console.log("Début synchronisation...");
    let th:any = this;
    // Synchroniser les devoirs entre le serveur et le localStorage si la version distante a changé
    // Et envoyer en même temps les pendingLIST
    this._sync.checkConnection();
    if (this._sync.isOnline()) {
      this._sync.syncDevoirs(this.type)
        .then(
          function (status:number):Promise<any> {
            // Si la version a changé, on rafraîchit les données
            if (status==1) {
              console.log("Devoirs récupérés du serveur");
              th.refresh();
            }
            return Promise.resolve();
          },
          function (erreur:string) {
            console.log("Erreur syncDevoirs : "+erreur);
            return Promise.reject(erreur);
          }
        )
        .then(
          function () {
            console.log("Synchronisation terminée !");
          },
          function (erreur:string) {
            th._notif.add(2,'Erreur de synchronisation',erreur);
            console.log("Echec de la synchronisation. (en ligne : "+th._sync.isOnline()+")");
          }
        );
    } else { console.log("Synchro abandonnée, pas d'Internet ! "); }
  }

  public refresh():void {
    this.devoirs = this.getDevoirs();
    this.recalcSections();
  }

  public syncrefresher(refresher):void {
    let th:any = this;
    this._sync.getDevoirs(this.type).then(
      function (devoirs:Devoir[]) {
        console.log("Devoirs récupérées");
        window.localStorage.setItem(th.type, JSON.stringify(devoirs));
        th.refresh();
        refresher.complete();
      },
      function (erreur:string) {
        th._sync.checkConnection();
        th._notif.add(2, "Erreur", erreur);
        refresher.complete();
      }
    );
  }

  /**
   * Récupère les devoirs du local Storage
   */
  public getDevoirs():Devoir[] {
    return this._parse.parse(this.type);
  }
  /**
   * Recalcule les sections à partir du tableau de devoirs du component
   * ATTENTION : On suppose que les devoirs sont déjà triés par date et classés par matière
   * @return {Section[]}
   */
  private recalcSections():void {
    console.log("SECTIONS");
    let devoirs = this.filtrage(this.devoirs);
    let filtres_name:string[] = [];
    let filtres_count:number[] = [];
    this.flags_count = Array.apply(null, Array(this.flags.length)).map(Number.prototype.valueOf,0);
    // Retour
    let sections:Section[] = [];
    // Variables pour la boucle
    let section:Section = new Section();
    let lastDate:Date = new Date();
    let premier:boolean=true;
    // Pour chaque devoir...
    devoirs.forEach(function (devoir) {
      // Compte les flags
      this.flags_count[devoir.flag]++;
      // Enregistre les filtres appliquables
      if (filtres_name.indexOf(devoir.matiere)<0) {
        filtres_name.push(devoir.matiere);
        filtres_count[filtres_name.indexOf(devoir.matiere)]=1;
      }
      else
        filtres_count[filtres_name.indexOf(devoir.matiere)]++;
      // Si la date (jour) du devoir est différente de celle du précédent...
      //if (devoir.date.toDateString()!=lastDate.toDateString()) {
      if (devoir.date.toLocaleDateString()!=lastDate.toLocaleDateString()) {
        // ...S'il s'agit du premier élément...
        if (premier) {
          // ...alors le prochain ne sera plus le premier !
          premier = false;
        } else { // Sinon...
          // ...On ajoute la section en cours au retour
          sections.push(section);
        }
        // On initialise une nouvelle section
        let day_num:string = devoir.date.getDate().toString();
        let day_texte:string = this._date.getDay(devoir.date);
        section = {
          "date":devoir.date,
          "titre":day_num,
          "mois":(devoir.date.getMonth()!=lastDate.getMonth()?this._date.getMonth(devoir.date):null),
          "sous_titre":day_texte,
          "devoirs": []
        };
      } else if (premier) {
        premier = false;
        section = {
          "date":new Date(),
          "titre":"",
          "mois":null,
          "sous_titre":"Aujourd'hui",
          "devoirs": []
        };
      }
      // On ajoute le devoir à la section en cours
      section.devoirs.push(devoir);
      // On remplace la "date du dernier devoir" par celle de celui en cours
      lastDate=devoir.date;
      // Puis on passe au suivant !
    },this);
    // On ajoute la dernière section créée aux sections
    if(!premier)
      sections.push(section);
    // On créé les filtres appliquables
    if (this.filtre==""&&this.filtre_texte==""&&this.selectedFiltres.length==0) {
      this.filtres=[];
      filtres_name.forEach(
        function (name:string, index:number) {
          this.filtres.push({
            "label": "#" + name + " (" + filtres_count[index] + ")",
            "value": "#" + name
          });
        }, this
      );
    }
    // Et on renvoi les sections !
    this.sections = sections;
  }
  /**
   * Applique un filtre aux devoirs s'il y a eu lieu
   * Remarque :
   * @return Devoir[]
   */
  private filtrage(devoirs:Devoir[]):Devoir[] {
    let filtre_full = "";
    filtre_full+=this.selectedFiltres.join('||');
    if (this.filtre_texte.length>1) {
      if (filtre_full.length>0)
        filtre_full+="&&";
      filtre_full += this.filtre_texte;
    }
    if (this.filtrdone) {
      if (filtre_full.length>0)
        filtre_full+="&&";
      filtre_full += "-0";
    }
    if (this.filtre.length>0) {
      filtre_full+=this.filtre;
    }
    // Filtre complet établi
    if (filtre_full.length<2) {
      this.selectedFiltres=[];
      return devoirs;
    }
    else {
      console.log("FILTREDEVOIRS : "+filtre_full); // DEBUG
      // Devoirs renvoyés
      let retour:Devoir[] = [];
      /*
      Méthode 1 : Filtrer par condition

      // On récupère les conditions "ET"
      let filtresET:string[] = filtre_full.trim().split("&&");
      // Trouve le premier tableau non vide
      let nonvide:number = 0;
      let premier:boolean = true;
      // Pour chaque condition "ET"
      for (let i:number = 0; i<filtresET.length; i++) {
        // On récupère les conditions "OU"
        let filtresOU:string[] = filtresET[i].trim().split("||");
        // Sélection des devoirs pour ce groupement "ET"
        let retourTEMP:Devoir[] = [];
        // Pour chaque condition "OU"
        for (let j:number = 0; j < filtresET[i].length; j++) {
          if (filtresOU[j]!=null && filtresOU[j] != "") {
            nonvide++;
            // On récupère le type de filtrage
            let type:string = filtresOU[j].substr(0,1);
            let search:string = filtresOU[j].substr(1);
            // Pour chaque devoir
            for (let k:number = 0; k < devoirs.length; k++) {
              // On teste s'il correspond à la condition selon le type de filtre
              // Si le devoir répond à la condition (selon le type de filtre)
              if (
                (type == "@" && devoirs[k].auteur.toLowerCase().match("^" + search.toLowerCase())) ||
                (type == "#" && devoirs[k].matiere.toLowerCase().match("^" + search.toLowerCase())) ||
                (type == "=" && devoirs[k].date.toLocaleDateString() == search) ||
                (type == ":" && devoirs[k].flag == this.flags.indexOf(search)) ||
                (type == "-" && devoirs[k].fait == (parseInt(search)==1)) ||
                (devoirs[k].texte.toLowerCase().match(filtresOU[j].toLowerCase()))
              ) {
                // En évitant les doublons, on l'ajoute aux résultats retournés de la sous condition en cours
                if (retourTEMP.indexOf(devoirs[k]) < 0) {
                  retourTEMP.push(devoirs[k]);
                }
              }
            }
          }
        }
        // A ce stade tous les devoirs répondant à au moins une condition du groupe "OU"
        // sont ajoutés au tableau retourTEMP (sans doublon)
        // Ajout au tableau de retour final
        // S'il s'agit du premier tour, on copie tout simplement le contenu
        if (premier&&nonvide>0) {
          premier=false;
          retour=retourTEMP.slice();
        }
        // Sinon, on supprime les éléments qui ne sont pas présents dans les deux
        else if(retourTEMP.length>0) {
          let length:number = retour.length;
          let todelete:Devoir[] =[];
          for (let l:number=0;l<length;l++) {
            let et:boolean = false;
            for (let k:number = 0;!et&&k<retourTEMP.length;k++)
              if (retour[l]==retourTEMP[k])
                et = true;
            if (!et)
              todelete.push(retour[l]);
          }
          for (let k:number=0;k<todelete.length;k++)
            retour.splice(retour.indexOf(todelete[k]),1);
        } else if (nonvide>0) {
          retour = [];
        }
      }
      */
      /*
      Méthode 2 : Filtrer par devoir puis par condition
      */
      // Etablit la liste des conditions
      let filtres:string[][] = [];
      let filtresET:string[] = filtre_full.trim().split("&&");
      for(let i:number = 0, ib:number= 0;i<filtresET.length;++i) {
        if (filtresET[i]!=null&&filtresET[i].length>1) {
          filtres[ib] = [];
          let filtresOU: string[] = filtresET[i].trim().split("||");
          for(let j:number=0;j<filtresOU.length;++j) {
            if (filtresOU[j]!=null&&filtresOU[j].length>1) {
              filtres[ib].push(filtresOU[j]);
            }
          }
          ib++;
        }
      }
      filtresET=null;
      // Pour chaque devoir, on vérifie s'il vérifie au moins une condition OU de chaque bloc ET
      for (let k:number = 0; k<devoirs.length; ++k) {
        let sv: boolean = true; // "still validated" par défaut, il répond aux conditions jusqu'à preuve du contraire
        // Pour chaque bloc ET
        for (let i: number = 0; i < filtres.length && sv; ++i) {
          let bnv: boolean = true; // "bloc not validated" par défaut il faut prouver au moins une condition du bloc
          for (let j: number = 0; j < filtres[i].length && bnv; ++j) {
            // Le premier charactère de la condition de filtrage définit le type de filtrage
            let t: string = filtres[i][j].substr(0, 1);
            // Le reste de la chaine correspond au critère de filtrage
            let s: string = filtres[i][j].substr(1);
            if (
              ( t == "@" && devoirs[k].auteur.toLowerCase().match("^" + s.toLowerCase()) ) ||
              ( t == "#" && devoirs[k].matiere.toLowerCase().match("^" + s.toLowerCase()) ) ||
              ( t == "=" && devoirs[k].date.toLocaleDateString() == s ) ||
              ( t == ":" && devoirs[k].flag == this.flags.indexOf(s) ) ||
              ( t == "-" && devoirs[k].fait == (parseInt(s) == 1) ) ||
              ( devoirs[k].texte.toLowerCase().match(filtres[i][j].toLowerCase()) )
            ) {
              // Le devoir répond à la condition
              // Le bloc est donc validé
              bnv = false;
            }
          }
          if (bnv) sv=false;
        }
        if (sv) retour.push(devoirs[k]);
      }
      return retour;
    }
  }

  public filtr(filtr:string) {
    this.filtre+="&&"+filtr;
    this.refresh();
    this._notif.add(0,"Filtre ajouté !","");
  }
  public clear_filtr():void {
    this.selectedFiltres=[];
    this.filtre="";
    this.filtre_texte="";
    this.refresh();
  }
  public invertdone():void {
    this.filtrdone=!this.filtrdone;
    window.localStorage.setItem("fd"+this.type,JSON.stringify(this.filtrdone));
    this.refresh();
  }

  public done(devoir:Devoir):void {
    // On change l'état du devoir
    devoir.fait=!devoir.fait;
    // On met à jour le nombre de "marqué comme fait"
    let increment:number=0;
    if (devoir.fait)
      increment = +1;
    else
      increment = -1;
    this.devoirs[(this.devoirs).indexOf(devoir)].nb_fait+=increment;
    // Ajoute à la liste d'actions en attente
    this.pend("DO",{"id":devoir.id,"done":devoir.fait});
  }
  /**
   * Ajoute un devoir à la liste de "merge"
   * @param devoir
   */
  public addToMerge(devoir:Devoir):void {
    let faisable:boolean = true;
    let raison:string = "";
    // Si la liste d'attente est vide, il n'y a pas de risque
    if (this.merge.length>0) {
      // Sinon il faut vérifier que le "merge" est faisable
      // Tant que c'est faisable, on cherche un conflit
      let i:number = 0;
      while (faisable&&i<this.merge.length) {
        // S'ils sont les même
        if (devoir.id==this.merge[i].id) {
          faisable = false;
          raison="autre";
        }
        // S'ils ne sont pas pour la même matière
        else if (devoir.matiere!=this.merge[i].matiere) {
          faisable = false;
          raison="de la même matière";
        }
        // S'ils ne sont pas pour la même date
        else if (devoir.date.valueOf()!=this.merge[i].date.valueOf()) {
          faisable = false;
          raison="pour la même date";
        }
        i++;
      }
    }
    if (faisable)
      this.merge.push(devoir);
    else
      this._notif.add(2,
        "Impossible de fusionner",
        "Etant donné les devoirs déjà en attente de fusion celui ci ne peut être ajouté.\n" +
        "Choisis en un "+raison+" ou vide la liste de fusion."
      );

  }
  public clearMerge():void {
    this.merge = [];
  }
  public doMerge():void {
    let ids:number[] = [];
    for (let i:number=0;i<this.merge.length;i++)
      ids[i]=this.merge[i].id;
    this.pend("MERGE",ids);
    this._notif.add(0,
      "Fusion préparée",
      "La demande de fusion pour ces "+this.merge.length+" devoirs sera bientôt transmise au serveur, à la prochaine synchronisation les anciens devoirs seront remplacés par le résultat de cette fusion !"
    );
    this.merge = [];
  }

  /**
   * Signale le devoir comme indésirable
   * @param devoir
   */
  public signaler(devoir:Devoir):void {
    // On ajoute l'ID du devoir à la liste d'attente des signalements
    this.pend("ALERT",devoir.id);
    // Notifie l'utilisateur
    this._notif.add(1,"Devoir signalé !", "Un modérateur l'examinera prochainement. S'il n'est pas conforme à nos règles d'utilisation il sera supprimé et son auteur sanctionné, ton identité ne sera jamais dévoilée au cours du processus.");
  }
  /**
   * Suppression d'un devoir
   * @param devoir à supprimer
   */
  public supprimer(devoir:Devoir):void {
    let th = this;
    this._notif.ask(
      "Confirmation",
      "La suppression est définitive. Plus aucun utilisateur n'aura accès à ce devoir.",
      "Confirmer", "Annuler")
      .then(
        function() {
          // Supprimer de devoirs[]
          th.devoirs.splice((th.devoirs).indexOf(devoir),1);
          // Ajout à la liste de suppression de devoirs
          th.pend("DEL",devoir.id);
          // Notifie l'utilisateur
          th._notif.add(0,"Effectué.", "Le devoir a été supprimé de l'agenda !");
        },
        function(reject:string) {
          console.log(reject);
        }
      )
      .catch(
        function (reject) {
          console.log(reject);
        }
      );
  }

  /**
   * Affiche les commentaires du devoir sélectionné
   * @param devoir sélectionné
   */
  public presentComms(devoir:Devoir):void {
    let commModal = this.modalCtrl.create(CommModal, { devoir:devoir });
    commModal.onDidDismiss(() => {
      this.sync();
    });
    commModal.present().then(
      succes=>console.log("Commentaires ouverts."),
      erreur=>console.log(erreur)
    );
  }

  public setFlag(devoir:Devoir) {
    let alert = this.alertCtrl.create();
    alert.setTitle('Ajouter un marqueur');
    for (let i:number=0;i<this.flags.length;i++)
      alert.addInput({
        type: 'radio',
        label: this.flagsfr[i],
        value: i+"",
        checked: false
      });
    alert.addButton('Annuler');
    alert.addButton({
      text: 'OK',
      handler: data => {
        devoir.flag = parseInt(data);
        this.pend("FLAG", {"id": devoir.id, "flag": data});
      }
    });
    alert.present().then(
      succes=>console.log("Fenetre d'ajout de drapeau"),
      erreur=>console.log(erreur)
    );
  }

  private pend(list:string, push:any):void {
    // Ecrase localstorage
    window.localStorage.setItem(this.type, JSON.stringify(this.devoirs));
    // Ajoute l'opération à la liste d'attente du suppression de commentaires
    let pending=JSON.parse(window.localStorage.getItem("pend"+list));
    pending.push(push);
    window.localStorage.setItem("pend"+list, JSON.stringify(pending));
    // Lance une synchronisation
    this.sync();
    // Rafraichi l'affichage
    this.refresh();
  }

  /*public onUpload(event:any) {
    this._notif.add(0,'Fichier(s) envoyé(s)','');
    this.sync();
  }*/

  /*fileDevoir(event,devoir: Devoir, overlaypanel: OverlayPanel) {
    this.selectedDevoir = devoir;
    this.fileComm=null;
    overlaypanel.toggle(event);
  }*/

  supprFile(file:PJ) {
    let th = this;
    this._sync.supprFile(file)
      .then(
        function () {
          th._notif.add(0,'Fichier supprimé','');
          window.localStorage.setItem("version","");
          th.sync();
        },
        function (erreur:string) {
          th._notif.add(2,'Erreur','Le fichier n\'a pas été supprimé ('+erreur+')');
        }
      )
  }

  acceptInvitation(invit:Invitation):void {
    let th:any = this;
    this._sync.acceptInvitation(invit).then(
      function () {
        th._notif.add(0,'Effectué','Tu es désormais membre de '+invit.groupe);
        th.getInvitations();
      },
      function (erreur:string) {
        th._notif.add(2,'Erreur',erreur);
        th.getInvitations();
      }
    );
  }

  declineInvitation(invit:Invitation):void {
    let th:any = this;
    this._sync.declineInvitation(invit).then(
      function () {
        th._notif.add(0,'Invitation refusée','');
        th.getInvitations();
      },
      function (erreur:string) {
        th._notif.add(2,'Erreur',erreur);
        th.getInvitations();
      }
    );
  }

  private getInvitations():void {
    this._sync.getInvitations().then(
      invitations => this.invitations = invitations,
      erreur => console.log("invitations : "+erreur)
    );
  }

  pageParam():void {
    this._sync.checkConnection();
    if (this._sync.isOnline())
      this.navCtrl.push(UserPage).then(
        value => console.log("Navigation vers paramètres"),
        erreur => this._notif.add(0,erreur.value,"Une erreur est survenue")
      );
    else
      this._notif.add(2,"Hors connexion","Une connexion à Internet est nécessaire pour modifier les paramètres");
  }
}
