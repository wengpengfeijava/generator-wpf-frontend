'use strict';
var Generator = require ( 'yeoman-generator' );
var chalk     = require ( 'chalk' );
var yosay     = require ( 'yosay' );
var path      = require ( 'path' );

module.exports = Generator.extend ( {
    initializing: function () {    //初始化准备工作
        console.log ( 'init' );

        this._copyApp = function ( appName ) {
            var me = this;
            [
                {
                    from: 'app/',
                    name: '_index.html',
                    to  : appName + '/index.html'
                },
                {
                    from: 'app/js/',
                    name: '_app.js',
                    to  : appName + '/js/Root.app.js'
                },
                {
                    from: 'app/styles/',
                    name: '_webstyles.less',
                    to  : appName + '/styles/webstyles.less'
                }
            ].forEach ( function ( file ) {
                me.fs.copyTpl ( me.templatePath ( file.from + file.name ), file.to, me );
            } )
        }

        this.stuctureMap = {
            'single'  : ['app'],
            'multiple': [
                'app/admin', 'app/portal', 'app/login', 'app/center'
            ]
        }
    },

    prompting: function () {  //接受用户输入
        var done = this.async (); //当处理完用户输入需要进入下一个生命周期阶段时必须调用这个方法
        //yeoman-generator 模块提供了很多内置的方法供我们调用，如下面的this.log , this.prompt , this.template , this.spawncommand 等
        this.log (
            yosay ( 'Welcome to the groundbreaking ' + chalk.red ( 'example' ) + ' generator!'
            ) );
        this.name        = path.basename ( process.cwd () );
        this.license     = 'ISC';
        this.description = '';
        this.author      = '';
        var prompts      = [
            {
                type   : 'input',
                name   : 'name',
                message: 'name of app:', default: this.name
            },
            {
                type   : 'input',
                name   : 'description',
                message: 'description:', default: this.description
            },
            {
                type: 'list', name: 'structure', message: 'which structure you need?', choices: [
                {
                    name : 'single (app as root)',
                    value: 'single'
                },
                {
                    name : 'multiple  (app/admin、app/portal、app/login、app/center) as root',
                    value: 'multiple'
                }
            ]
            },
            {
                type   : 'list',   // 提供选择的列表
                name   : 'angularVersion',
                message: 'which version of angular',
                choices: [
                    {
                        name : 'angular@1.2.x',
                        value: '1.2.x'
                    },
                    {
                        name : 'angular@1.3.x',
                        value: '1.3.x'
                    }
                ]
            },
            {
                type   : 'input',
                name   : 'repo',
                message: 'git repository:', default: this.repo
            },
            {
                type   : 'input',
                name   : 'license',
                message: 'license:', default: this.license
            },
            {
                type   : 'input',
                name   : 'author',
                message: 'author:', default: this.author
            }
        ];
        this.prompt ( prompts )
            .then ( function ( props ) {
                this.name           = props.name;
                this.angularVersion = props.angularVersion;
                this.repo           = props.repo;
                this.license        = props.license;
                this.author         = props.author;
                this.description    = props.description;
                this.structure      = props.structure;
                done ();  //进入下一个生命周期阶段
            }.bind ( this ) )
    },

    writing: {
        config: function () {
            var me = this;
            [
                '_package.json', '_gulpfile.js', '_bower.json', '_.bowerrc'
            ].forEach ( function ( configFile ) {
                var to = configFile.replace ( /^_/, '' )
                me.fs.copyTpl ( me.templatePath ( configFile ), to, me );
            } )
        },
        app   : function () {
            var me = this;
            this.stuctureMap[this.structure].forEach ( function ( structure ) {
                me._copyApp ( structure );
            } )
        }
    },

    install: function () {
        console.log ( 'install' );
        var done = this.async ();
        this.spawnCommand ( 'bower', ['install'] )  //安装项目依赖
            .on ( 'exit', function ( code ) {
                if ( code ) {
                    done ( new Error ( 'code:' + code ) );
                } else {
                    done ();
                }
            } )
            .on ( 'error', done );
    },
    end    : function () {

        console.log ( 'end' );
        // var done = this.async ();
        // this.spawnCommand ( 'gulp' )   //生成器退出前运行gulp，开启watch任务
        //     .on ( 'exit', function ( code ) {
        //         if ( code ) {
        //             done ( new Error ( 'code:' + code ) );
        //         } else {
        //             done ();
        //         }
        //     } )
        //     .on ( 'error', done );
    }
} );