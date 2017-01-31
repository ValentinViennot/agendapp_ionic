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
import {NavParams, ViewController} from "ionic-angular";
import {NotificationService} from "../../services/notification.service";
import {SyncService} from "../../services/sync.service";
import {Groupe} from "../../concepts/groupe";

@Component({
  selector: 'mod-color',
  templateUrl: 'color.html',
  providers: [
  ]
})
export class ColorModal {

  groupe:Groupe;

  rouge:number;
  vert:number;
  bleu:number;

  constructor(
    private _notif: NotificationService,
    private _sync: SyncService,
    public params: NavParams,
    public viewCtrl: ViewController
  ) {
    this.groupe=params.get('groupe');
    this.loadHexToRgb();
  }

  /**
   * Fermeture de la fenêtre modale
   */
  private dismiss() {
    this.viewCtrl.dismiss().then(
      succes=>console.log("Choix de couleur terminé."),
      erreur=>this._notif.add(1,"Erreur",erreur)
    );
  }

  save():void {
    this._sync.setColor(this.groupe.id,this.intToHex(this.rouge)+this.intToHex(this.vert)+this.intToHex(this.bleu))
      .then(
        succes=>this.dismiss(),
        erreur=>this._notif.add(2,"Echec de l'enregistrement",erreur)
      );
  }

  private loadHexToRgb():void {
    if (this.groupe.color!=null) {
      this.groupe.color=""+this.groupe.color;
      this.rouge=this.calcHex(this.groupe.color.substr(0,2));
      this.vert=this.calcHex(this.groupe.color.substr(2,2));
      this.bleu=this.calcHex(this.groupe.color.substr(4,2));
      if (isNaN(this.rouge)) this.rouge=0;
      if (isNaN(this.vert)) this.vert=0;
      if (isNaN(this.bleu)) this.bleu=0;
    } else {
      this.rouge=0;
      this.vert=0;
      this.bleu=0;
    }
  }

  private intToHex(int:number):string {
    let hex:string=this.intToChar(int%16);
    let q:number=Math.floor(int/16);
    hex=this.intToChar(q%16)+hex;
    return hex;
  }

  private calcHex(hex:string):number {
    return this.hexToInt(hex.substr(0,1))*16+this.hexToInt(hex.substr(0,1));
  }

  private hexToInt(hex:string):number {
    switch (hex) {
      case '0':
        return 0;
      case '1':
        return 1;
      case '2':
        return 2;
      case '3':
        return 3;
      case '4':
        return 4;
      case '5':
        return 5;
      case '6':
        return 6;
      case '7':
        return 7;
      case '8':
        return 8;
      case '9':
        return 9;
      case 'A':
        return 10;
      case 'B':
        return 11;
      case 'C':
        return 12;
      case 'D':
        return 13;
      case 'E':
        return 14;
      case 'F':
        return 15;
    }
  }

  private intToChar(int:number):string {
    switch (int) {
      case 0:
        return '0';
      case 1:
        return '1';
      case 2:
        return '2';
      case 3:
        return '3';
      case 4:
        return '4';
      case 5:
        return '5';
      case 6:
        return '6';
      case 7:
        return '7';
      case 8:
        return '8';
      case 9:
        return '9';
      case 10:
        return 'A';
      case 11:
        return 'B';
      case 12:
        return 'C';
      case 13:
        return 'D';
      case 14:
        return 'E';
      case 15:
        return 'F';
    }
  }

}
