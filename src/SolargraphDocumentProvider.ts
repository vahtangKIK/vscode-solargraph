'use strict';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';

export default class SolargraphDocumentProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange: vscode.EventEmitter<vscode.Uri>;
	private docs: {[uri: string]: string};
	private serverUrl: string;
	private languageClient: LanguageClient;

	constructor() {
		this._onDidChange = new vscode.EventEmitter<vscode.Uri>();
		this.docs = {};
	}

	public setLanguageClient(languageClient) {
		this.languageClient = languageClient;
	}

	public setServerUrl(url: string) {
		this.serverUrl = url;
	}

	public updateAll() {
		Object.keys(this.docs).forEach((uriString) => {
			this.update(vscode.Uri.parse(uriString));
		});
	}

	public remove(uri: vscode.Uri) {
		delete this.docs[uri.toString()];
	}

	provideTextDocumentContent(uri: vscode.Uri): string {
		console.log('I need to get the stuff for ' + uri);
		if (!this.docs[uri.toString()]) {
			this.update(uri);
		}
		return this.docs[uri.toString()] || 'Loading...';
	}

	private parseQuery(query: string): any {
		var result = {};
		var parts = query.split('&');
		parts.forEach((part) => {
			var frag = part.split('=');
			result[frag[0]] = frag[1];
		})
		return result;
	}

	public update(uri: vscode.Uri) {
		var that = this;
		var method = '$/solargraph' + uri.path;
		var query = this.parseQuery(uri.query);
		console.log(method + ' and ' + query.query);
		this.languageClient.sendRequest(method, { query: query.query }).then((result: any) => {
			this.docs[uri.toString()] = result.content;
			this._onDidChange.fire(uri);
		});
	}

	get onDidChange() {
		return this._onDidChange.event;
	}
}
