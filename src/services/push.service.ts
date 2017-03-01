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
import {Injectable} from "@angular/core";
import {NotificationService} from "./notification.service";


@Injectable()
export abstract class PushService {

  activated: boolean;

  constructor(public _notif: NotificationService) {
    if (window.localStorage.getItem("pushservice")==null)
      window.localStorage.setItem("pushservice", JSON.stringify(false));
    this.activated=JSON.parse(window.localStorage.getItem("pushservice"));
  }

  /**
   * Initialise le service de Push dans le cas où l'appareil y est inscrit
   */
  abstract initPush(): void;

  /**
   * Enregistre l'appareil s'il n'est pas encore inscrit
   * Désenregistre l'appareil s'il est déjà inscrit
   * @return Promise<string> Jeton d'inscriptin (ancien dans le cas d'un désenregistrement)
   * Resolve si l'action demandée a été éffectuée
   * Reject sinon
   */
  abstract registerPush(): Promise<string>;

  /**
   * @return Promise<string> Jeton d'inscription ou "" si non inscrit
   * Resolve si l'action demandée a été effectuée
   * Reject sinon
   */
  abstract getPushToken(): Promise<string>;

  public isActivated(): boolean {
    console.log(this.activated);
    return this.activated;
  }

  protected setActivated(b: boolean): void {
    window.localStorage.setItem("pushservice", JSON.stringify(b));
    this.activated = b;
  }

}



