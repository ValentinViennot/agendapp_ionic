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
import {Http, Headers, RequestOptions} from "@angular/http";
import "rxjs/add/operator/toPromise";
import {Devoir} from "../concepts/devoir";
import {User} from "../concepts/user";
import {PJ} from "../concepts/PJ";
import {Groupe} from "../concepts/groupe";
import {Invitation} from "../concepts/invitation";
import {Injectable} from "@angular/core";
import {Splashscreen} from "ionic-native";

@Injectable()
export class SyncService {

    // urls des apis
    private urls:string[];
    private headers: RequestOptions;
    private online:boolean;
    /** Peut on faire confiance à la valeur navigator.onLine ? */
    private trustonline:boolean;

    constructor(
      private http:Http
    ) {
        this.login("");
        this.online=navigator.onLine;
        this.trustonline=true;
    }

    // Gestion des codes erreur HTTP
    private handleError(error: any): Promise<any> {
        console.log(error.status);
        switch (error.status) {
            case 0:
                this.online = false;
                if (navigator.onLine)
                  // S'il y a incohérence entre la variable du navigateur et la réalité
                  this.trustonline=false;
                return Promise.reject("Ressource indisponible... Essaie de recharger la page.");
            case 400:
                this.online = true;
                return Promise.reject("La syntaxe de la requête est erronée : Merci de signaler cette erreur à contact@agendapp.fr");
            case 401:
                this.online = true;
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("user");
                window.location.reload();
                return Promise.reject("Identification nécessaire.");
            case 404:
                this.online = true;
                return Promise.reject("La ressource demandée n'existe pas ou plus. Recharge la page, puis essaie à nouveau.");
            case 503:
                this.online = true;
                return Promise.reject("Erreur interne au serveur (base de données non connectée, par exemple). Si le problème persiste : contact@agendapp.fr");
            default:
                this.online = true;
                console.log("Erreur non gérée par handleError");
                return Promise.reject("Erreur "+error.status);
        }
    }

    // Ajout du token
    public login(token: string): void {
      this.initUrls();
      let headers = new Headers({'Content-Type': 'application/json'});
      headers.append('Authorization', token);
      this.headers = new RequestOptions({headers: headers});
    }

    private initUrls():void {
        let base:string = "https://apis.agendapp.fr";
        this.urls = [];
        this.urls.push(base+"/logout/"); // 0 logout
        this.urls.push(base+"/user/"); // 1 user
        this.urls.push(base+"/devoirs/"); // 2 devoirs
        this.urls.push(base+"/pending/"); // 3 pending
        this.urls.push(base+"/version/"); // 4 version
        this.urls.push(base+"/cdn/"); // 5 cdn
        this.urls.push(base+"/courses/"); // 6 courses (groupes souscrits)
        this.urls.push(base+"/groupes/"); // 7 groupes et matières
        this.urls.push(base+"/login/"); // 8 login
        this.urls.push(base+"/invitations/"); // 9 invitations
        for (let i: number = 0; i < this.urls.length; i++)
          // "nt" = "no token" : pour des raisons historiques et de compatibilité
          this.urls[i] += "?nt";
    }

    public logout(every:boolean):void {
        this.http.get(this.urls[0]+"&all="+(every?1:0),this.headers)
            .toPromise()
            .then(
                function () {
                    Splashscreen.show();
                    window.localStorage.clear();
                    window.location.reload();
                }
            )
            .catch(erreur => this.handleError(erreur));
    }

    // 1 user

    public syncUser():Promise<any> {
        let th = this;
        return this.http.get(this.urls[1],this.headers)
            .toPromise()
            .then(
                function (response):Promise<any> {
                    window.localStorage.setItem("user",JSON.stringify(response.json() as User));
                    return Promise.resolve();
                },
                function (erreur):Promise<any> {
                    return th.handleError(erreur);
                }
            );
    }

    public saveUser(user:any):Promise<any> {
        return this.http.put(
            this.urls[1],
            JSON.stringify(user),this.headers)
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    // 2 devoirs et archives
    /**
     * Envoi les listes d'attente au serveur
     * Ecrase le localStorage avec les devoirs si la version est plus récente
     * @param type Devoirs ou Archives (minuscules)
     * @return resolve avec 1 si la version a changé, 0 sinon et reject s'il y a eu une erreur
     */
    public syncDevoirs(type:string):Promise<any> {
        let th:any = this;
        // Si l'utilisateur n'est pas connecté, on s'évite des étapes inutiles
        if (navigator.onLine) {
            // On commence par envoyer les requêtes
            return this.sendPending()
            // Puis, quand elles ont été traitées, on récupère les devoirs si version différente
                .then(
                    result => th.getDevoirsIf(type),
                    erreur => Promise.reject(erreur)
                );
        }
        else {
            return Promise.reject("Pas de connexion Internet !");
        }
    }

    /**
     * Récupère les devoirs depuis le serveur
     * @param type Devoirs ou Archives
     * @return {Promise<Devoir[]>} Devoirs
     */
    public getDevoirs(type:string):Promise<Devoir[]> {
        return this.http.get(this.urls[2]+"&"+type,this.headers)
            .toPromise()
            .then(
                response => response.json() as Devoir[],
                erreur => this.handleError(erreur)
            );
    }

    /**
     * Ecrase le localStorage par les devoirs si la version locale est différente de la version serveur
     * @param type Archives ou Devoirs
     * @return {Promise<>}
     */
    public getDevoirsIf(type:string):Promise<any> {
        let th = this;
        // Récupère la version des devoirs (plus exactement des matières et groupes souscrits)
        return this.getVersion()
            .then(
                function (version):Promise<any> {
                    // Si la version serveur est différente de celle locale
                    if (window.localStorage.getItem("version")!=version)
                    {
                        // Alors on écrase le local storage avec les devoirs récupérés du serveur
                        return th.getDevoirs(type).then(
                            function(devoirs:Devoir[]):Promise<any> {
                                // En pendant à actualiser la version locale en cas de succès
                                window.localStorage.setItem("version",version);
                                window.localStorage.setItem(type, JSON.stringify(devoirs));
                                // On retourne 1 pour avertir de rafraichir l'affichage du component à l'origine de la requete
                                return Promise.resolve(1);
                            },
                            erreur => Promise.reject(erreur)
                        );
                    }
                    else {
                        // versions identiques : On résoud avec un 0 pour ne pas rafraichir inutilement l'affichage
                        return Promise.resolve(0);
                    }
                },
                erreur => Promise.reject(erreur)
            );
    }

    // 3 pending

    /**
     * Envoi toutes les listes d'attentes au serveur pour les traiter
     * @return Resolve si pas de file d'attente ou si réussite, reject sinon
     */
    public sendPending():Promise<any> {
        let th = this;
        // On vérifie la présence des variables dans le stockage local
        if (
            window.localStorage.getItem("pendALERT")
            &&window.localStorage.getItem("pendADD")
            &&window.localStorage.getItem("pendCOMM")
            &&window.localStorage.getItem("pendDEL")
            &&window.localStorage.getItem("pendDELc")
            &&window.localStorage.getItem("pendDO")
            &&window.localStorage.getItem("pendFLAG")
            &&window.localStorage.getItem("pendMERGE")
        ) {
            // On stocke temporairement les pending list
            let pendings = {
                pendADD:JSON.parse(window.localStorage.getItem("pendADD")),
                pendALERT:JSON.parse(window.localStorage.getItem("pendALERT")),
                pendCOMM:JSON.parse(window.localStorage.getItem("pendCOMM")),
                pendDEL:JSON.parse(window.localStorage.getItem("pendDEL")),
                pendDELc:JSON.parse(window.localStorage.getItem("pendDELc")),
                pendDO:JSON.parse(window.localStorage.getItem("pendDO")),
                pendFLAG:JSON.parse(window.localStorage.getItem("pendFLAG")),
                pendMERGE:JSON.parse(window.localStorage.getItem("pendMERGE"))
            };
            // S'il y a des opérations à faire
            if (pendings.pendALERT.length
            +pendings.pendADD.length
            +pendings.pendCOMM.length
            +pendings.pendDEL.length
            +pendings.pendDELc.length
            +pendings.pendDO.length
            +pendings.pendFLAG.length
            +pendings.pendMERGE.length > 0) {
                // On vide les pending list (opérations en attente) du local storage (navigateur)
                // pour éviter les doublons si une deuxième synchro se déclenchait
                window.localStorage.setItem("pendALERT", "[]");
                window.localStorage.setItem("pendADD", "[]");
                window.localStorage.setItem("pendCOMM", "[]");
                window.localStorage.setItem("pendDEL", "[]");
                window.localStorage.setItem("pendDELc", "[]");
                window.localStorage.setItem("pendDO", "[]");
                window.localStorage.setItem("pendFLAG", "[]");
                window.localStorage.setItem("pendMERGE", "[]");
                // On effectue la requête
                return this.http.post(
                    this.urls[3],
                    JSON.stringify(pendings),
                    this.headers)
                    .toPromise()
                    .catch(
                        function (erreur) {
                            // En cas d'erreur, on remet les élements en attente dans leur liste
                            window.localStorage.setItem("pendALERT", JSON.stringify(pendings.pendALERT));
                            window.localStorage.setItem("pendADD", JSON.stringify(pendings.pendADD));
                            window.localStorage.setItem("pendCOMM", JSON.stringify(pendings.pendCOMM));
                            window.localStorage.setItem("pendDEL", JSON.stringify(pendings.pendDEL));
                            window.localStorage.setItem("pendDELc", JSON.stringify(pendings.pendDELc));
                            window.localStorage.setItem("pendDO", JSON.stringify(pendings.pendDO));
                            window.localStorage.setItem("pendFLAG", JSON.stringify(pendings.pendFLAG));
                            window.localStorage.setItem("pendMERGE", JSON.stringify(pendings.pendMERGE));
                            console.log("Impossible d'envoyer les listes");
                            return th.handleError(erreur);
                        }
                    );
            } else {
                return Promise.resolve("Pas d'opération en attente...");
            }
        } else {
            return Promise.reject("Il manque des variables locales !");
        }
    }

    // 4 version
    /**
     * Récupère la version des matières souscrites par l'utilisateur
     * @return {Promise<String>} Concaténation (DELIMITER #) des versions des matières de l'utilisateur
     */
    public getVersion():Promise<string> {
        return this.http.get(this.urls[4],this.headers)
            .toPromise()
            .then(
                response => response.json() as String,
                erreur => this.handleError(erreur)
            );
    }

    // 5 cdn

    public supprFile(file:PJ):Promise<any> {
        return this.http.get(this.urls[5]+"&delete&id="+file.file,this.headers)
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    // 6 courses (groupes souscrits)

    public getCourses():Promise<Groupe[]> {
        return this.http.get(this.urls[6],this.headers)
            .toPromise()
            .then(
                response => response.json() as Groupe[],
                erreur => this.handleError(erreur)
            );
    }

    public setColor(id:number,color:string):Promise<any> {
        return this.http.post(
                this.urls[6],
                JSON.stringify({
                    id:id,
                    color:color
                }),this.headers)
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    public joinCourse(id:number):Promise<any> {
        return this.http.put(
            this.urls[6],
            JSON.stringify({
                id:id
            }),this.headers)
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    public quitCourse(id:number):Promise<any> {
        return this.http.delete(this.urls[6]+"&id="+id,this.headers)
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    // 7 groupes et matières

    public getGroups(id:number):Promise<Groupe[]> {
        return this.http.get(this.urls[7]+"&id="+id,this.headers)
            .toPromise()
            .then(
                response => response.json() as Groupe[],
                erreur => this.handleError(erreur)
            );
    }

    public newGroup(group:Groupe):Promise<any> {
        return this.http.post(
            this.urls[7],
            JSON.stringify(group),this.headers)
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    // 8 login

    public getToken(infos:any):Promise<string> {
        return this.http.post(
            this.urls[8],
            JSON.stringify(infos),
            this.headers
        ).toPromise()
            .then(
                response => response.json(),
                erreur => this.handleError(erreur)
            );
    }

    // 9 invitations

    public getInvitations():Promise<Invitation[]> {
        return this.http.get(this.urls[9],this.headers)
            .toPromise()
            .then(
                response => response.json() as Invitation[],
                erreur => this.handleError(erreur)
            );
    }

    public acceptInvitation(invit:Invitation):Promise<any> {
        return this.http.post(
                this.urls[9]+"&id="+invit.id,
                JSON.stringify({
                    groupe:invit.groupeid
                }),
                this.headers
            )
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    public declineInvitation(invit:Invitation):Promise<any> {
        return this.http.delete(
                this.urls[9]+"&id="+invit.id,
                this.headers
            )
            .toPromise()
            .catch(erreur => this.handleError(erreur));
    }

    public checkConnection():void {
      console.log("Test de connexion Internet...");
      if (this.trustonline) {
        this.online = navigator.onLine;
        console.log("Test terminé : "+this.online);
      }
      else {
        console.log("Test secondaire lancé...");
        this.http.get("http://google.fr/")
          .toPromise()
          .then(
            succes => this.online = true,
            erreur => this.handleError(erreur)
          );
      }
    }

    public isOnline():boolean {
      return this.online;
    }
}

