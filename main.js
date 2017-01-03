var Editor = (function () {
    /* --------------------------------------------------------
    * コンストラクタ
    -------------------------------------------------------- */
    function Editor(editor) {
        this.editor = null;
        this.isEditingFuncStopped = false;
        this.editor = editor;
        this.editor.$blockScrolling = Infinity;
        this.editor.getSession().setMode('ace/mode/processing');
        this.editor.setTheme('ace/theme/twilight');
    }
    /* --------------------------------------------------------
    * 編集時に呼び出される処理を登録する
    -------------------------------------------------------- */
    Editor.prototype.editing = function (func) {
        var self = this;
        this.editor.on('change', function (e) {
            if (!self.isEditingFuncStopped) {
                func(e);
            }
        });
    };
    /* --------------------------------------------------------
    * 指定した列番号と行番号から何文字目かを返す
    -------------------------------------------------------- */
    Editor.prototype.charCount = function (col, row) {
        var txt = this.editor.getValue();
        var rows = txt.split('\n');
        var cnt = 0;
        for (var r = 0; r < row; r++) {
            // 改行分を+1する
            cnt += rows[r].length + 1;
        }
        cnt += col;
        return cnt;
    };
    /* --------------------------------------------------------
    * テキストをセットする
    -------------------------------------------------------- */
    Editor.prototype.setText = function (txt) {
        this.isEditingFuncStopped = true;
        this.editor.setValue(txt);
        this.isEditingFuncStopped = false;
    };
    /* --------------------------------------------------------
    * 読み取り専用の切り替えを行う
    -------------------------------------------------------- */
    Editor.prototype.setReadOnly = function (isReadOnly) {
        this.editor.setReadOnly(isReadOnly);
    };
    return Editor;
}());
var fs = require('fs');
var path = require('path');
var FileIO = (function () {
    function FileIO() {
        this.dirpath = '';
    }
    /* --------------------------------------------------------
    * 保存する
    -------------------------------------------------------- */
    FileIO.prototype.save = function (logger, complateFunc) {
        if (this.dirpath === '') {
            return;
        }
        var self = this;
        // ディレクトリが存在するかどうかを確認する
        fs.exists(this.dirpath, function (exists) {
            // ディレクトリ名
            var dirname = path.basename(self.dirpath);
            var proc = function () {
                // ソースファイルの書き出し
                fs.writeFile(self.dirpath + '/' + dirname + '.pde', logger.getCurentText());
                // ログファイルの書き出し
                fs.writeFile(self.dirpath + '/' + dirname + '.rec', 'bbb');
                complateFunc(self.dirpath);
            };
            if (exists) {
                proc();
            }
            else {
                // ディレクトリ作成
                fs.mkdir(self.dirpath);
                proc();
            }
        });
    };
    /* --------------------------------------------------------
    * 読み込む
    -------------------------------------------------------- */
    FileIO.prototype.load = function (complateFunc) {
        if (this.dirpath === '') {
            return;
        }
        var dirname = path.basename(this.dirpath);
        var text = fs.readFileSync(this.dirpath + '/' + dirname + '.pde').toString();
        var log = fs.readFileSync(this.dirpath + '/' + dirname + '.rec').toString();
        complateFunc(text, log);
    };
    return FileIO;
}());
var LogType;
(function (LogType) {
    LogType[LogType["Insert"] = 0] = "Insert";
    LogType[LogType["Remove"] = 1] = "Remove";
    LogType[LogType["Run"] = 2] = "Run";
})(LogType || (LogType = {}));
var Log = (function () {
    function Log() {
        this.beginIndex = -1; // 開始ログID
        this.endIndex = Number.MAX_VALUE; // 終了ログID
        this.char = '';
    }
    return Log;
}());
var EventLog = (function () {
    function EventLog() {
    }
    return EventLog;
}());
var Logger = (function () {
    /* --------------------------------------------------------
    * コンストラクタ
    -------------------------------------------------------- */
    function Logger(editor, slider) {
        this.editor = null; // エディタ
        this.slider = null; // スライダ
        this.isLogging = false; // ロギング中
        this.isPlaying = false; // 再生中
        this.logs = [];
        this.eventLogs = [];
        this.currentLogIndex = 0; // 現在のログID
        this.startTimestamp = (new Date()).getTime(); // ログ開始タイムスタンプ
        this.editor = editor;
        this.slider = slider;
        this.setupEditor();
    }
    /* --------------------------------------------------------
    * エディタの初期設定
    -------------------------------------------------------- */
    Logger.prototype.setupEditor = function () {
        if (!this.editor) {
            return;
        }
        var self = this;
        this.editor.editing(function (e) {
            if (!self.isLogging) {
                return;
            }
            var timestamp = (new Date()).getTime();
            var newLogIndex = self.getLatestLogIndex() + 1;
            var chars = e.lines[0];
            var cnt = self.editor.charCount(e.start.column, e.start.row);
            // 文字挿入
            if (e.action === 'insert') {
                var headIndex = self.getActualLogAryIndex(cnt);
                // 改行時の処理
                if (e.lines.length == 2) {
                    var log = new Log();
                    log.char = '\n';
                    log.beginIndex = newLogIndex;
                    log.endIndex = Number.MAX_VALUE;
                    self.logs.splice(headIndex, 0, log);
                }
                else {
                    for (var i = 0; i < chars.length; i++) {
                        var log = new Log();
                        log.char = chars.charAt(i);
                        log.beginIndex = newLogIndex;
                        log.endIndex = Number.MAX_VALUE;
                        self.logs.splice(headIndex + i, 0, log);
                    }
                }
                self.logging(LogType.Insert, timestamp);
            }
            else if (e.action === 'remove') {
                var headIndex = self.getActualLogAryIndex(cnt);
                for (var i = 0; i < chars.length; i++) {
                    self.logs[headIndex + i].endIndex = newLogIndex;
                }
                self.logging(LogType.Remove, timestamp);
            }
            self.currentLogIndex = newLogIndex;
            self.slider.attr('max', self.currentLogIndex);
            self.slider.val(self.currentLogIndex);
        });
    };
    /* --------------------------------------------------------
    *
    -------------------------------------------------------- */
    Logger.prototype.getActualLogAryIndex = function (idx) {
        var res = 0;
        var cnt = -1;
        for (res = 0; res < this.logs.length; res++) {
            var log = this.logs[res];
            if (log.beginIndex <= this.getLatestLogIndex() && log.endIndex > this.getLatestLogIndex()) {
                cnt++;
            }
            if (cnt == idx) {
                break;
            }
        }
        return res;
    };
    /* --------------------------------------------------------
    * 指定した時点のソースコードを返す
    -------------------------------------------------------- */
    Logger.prototype.getTextFromIndex = function (idx) {
        var txt = '';
        for (var i = 0; i < this.logs.length; i++) {
            var log = this.logs[i];
            if (log.beginIndex <= idx && log.endIndex > idx) {
                txt += log.char;
            }
        }
        return txt;
    };
    /* --------------------------------------------------------
    * 指定したログインデックスに変更する
    -------------------------------------------------------- */
    Logger.prototype.setCurrentLogIndex = function (idx) {
        this.editor.setReadOnly(!(idx == this.getLatestLogIndex()));
        this.currentLogIndex = idx;
        this.editor.setText(this.getTextFromIndex(idx));
    };
    /* --------------------------------------------------------
    * ログをとる
    -------------------------------------------------------- */
    Logger.prototype.logging = function (type, timestamp) {
        var eventLog = new EventLog();
        eventLog.type = type;
        eventLog.timestamp = timestamp;
        this.eventLogs.push(eventLog);
    };
    /* --------------------------------------------------------
    * ログを再生する
    -------------------------------------------------------- */
    Logger.prototype.play = function () {
        if (this.isPlaying) {
            return;
        }
        this.isLogging = false;
        // if (this.eventLogs.length-1 < this.currentLogIndex+1)
        // {
        // 	return;
        // }
        // var self = this;
        // setTimeout(function()
        // {
        // 	self.reproducing();
        // }, 1000);
    };
    Logger.prototype.reproducing = function () {
        console.log('aaa');
    };
    Logger.prototype.loadLog = function (log) {
    };
    /* --------------------------------------------------------
    * 現在のソースコードを返す
    -------------------------------------------------------- */
    Logger.prototype.getCurentText = function () {
        return this.getTextFromIndex(this.eventLogs.length - 1);
    };
    Logger.prototype.getLatestLogIndex = function () {
        return this.eventLogs.length - 1;
    };
    return Logger;
}());
var exec = require('child_process').exec;
var ProcessingUtil = (function () {
    function ProcessingUtil() {
    }
    ProcessingUtil.run = function (dirpath) {
        var command = 'processing-java --sketch=' + dirpath + ' --output=' + dirpath + '/output --force --run';
        exec(command, function (error, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
        });
    };
    return ProcessingUtil;
}());
var remote = require('electron').remote;
var dialog = require('electron').remote.dialog;
var main = remote.require('./index');
var $ = require('./jquery-2.1.3.min.js');
var Recoder = (function () {
    /* --------------------------------------------------------
    * コンストラクタ
    -------------------------------------------------------- */
    function Recoder() {
        this.editor = new Editor(ace.edit('input_txt'));
        this.slider = $('.slider');
        this.fileIO = new FileIO();
        var self = this;
        this.slider.on('input change', function () {
            self.logger.setCurrentLogIndex(self.slider.val());
        });
        this.logger = new Logger(this.editor, this.slider);
        this.logger.isLogging = true;
    }
    /* --------------------------------------------------------
    * プログラムを実行する
    -------------------------------------------------------- */
    Recoder.prototype.run = function () {
        if (this.logger.isPlaying) {
            return;
        }
        this.save(function (dirpath) {
            ProcessingUtil.run(dirpath);
        });
    };
    /* --------------------------------------------------------
    * 再生する
    -------------------------------------------------------- */
    Recoder.prototype.play = function () {
        if (this.logger.isPlaying) {
            return;
        }
        this.logger.play();
    };
    /* --------------------------------------------------------
    * 停止する
    -------------------------------------------------------- */
    Recoder.prototype.stop = function () {
    };
    /* --------------------------------------------------------
    * 保存する
    -------------------------------------------------------- */
    Recoder.prototype.save = function (complateFunc) {
        if (this.fileIO.dirpath === '') {
            // 保存ダイアログを開いて保存する
            this.showSaveDialog(complateFunc);
        }
        else {
            // 保存する
            this.fileIO.save(this.logger, complateFunc);
        }
    };
    /* --------------------------------------------------------
    * 保存ダイアログを表示する
    -------------------------------------------------------- */
    Recoder.prototype.showSaveDialog = function (complateFunc) {
        var _this = this;
        var defPath = main.getDesktopPath();
        var win = remote.getCurrentWindow();
        var self = this;
        dialog.showSaveDialog(win, {
            defaultPath: defPath
        }, function (o) {
            // キャンセルしたとき...
            if (o === undefined) {
                return;
            }
            console.log(o);
            // 保存する
            self.fileIO.dirpath = o;
            self.fileIO.save(_this.logger, complateFunc);
        });
    };
    /* --------------------------------------------------------
    * 読み込みダイアログを表示する
    -------------------------------------------------------- */
    Recoder.prototype.showOpenDialog = function (complateFunc) {
        var defPath = main.getDesktopPath();
        var win = remote.getCurrentWindow();
        var self = this;
        dialog.showOpenDialog(win, {
            defaultPath: defPath,
            properties: ['openDirectory']
        }, function (o) {
            // キャンセルしたとき...
            if (o === undefined) {
                return;
            }
            self.fileIO.dirpath = o[0];
            self.fileIO.load(function (text, log) {
                self.logger.loadLog(log);
                // TODO: のちに削除（エディタの管理はLoggerの仕事）
                // self.editor.setValue(text, -1);
            });
            complateFunc(o);
        });
    };
    return Recoder;
}());
/* --------------------------------------------------------
* エントリポイント
-------------------------------------------------------- */
$(function () {
    var recoder = new Recoder();
    $('#runBtn').click(function () {
        recoder.run();
    });
    $('#playBtn').click(function () {
        recoder.play();
    });
    main.setOpenProc(function () {
        recoder.showOpenDialog(function (dirpath) { });
    });
    main.setSaveProc(function () {
        recoder.save(function (dirpath) { });
    });
    // document.ondragover = (e) => {
    // 	e.preventDefault();
    // 	return false;
    // };
    // document.ondrop = (e) => {
    // 	e.preventDefault();
    // 	const dir = e.dataTransfer.files[0];
    // 	fileIO.load(dir.path);
    // 	return false;
    // };
});
