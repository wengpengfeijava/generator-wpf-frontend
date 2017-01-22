/**
 * Created by wengpengfei on 2016/8/8.
 */

var gulp         = require ( 'gulp' ),              // 基
    browserSync  = require ( 'browser-sync' ).create (),      // 浏览器同步服务神器
    connect      = require ( 'connect' ),           // 前端静态服务器
    serveStatic  = require ( 'serve-static' ),      // 文件映射
    less         = require ( 'gulp-less' ),         // less编译器
    clean        = require ( 'gulp-clean' ),        // 文件、文件夹 清除
    config       = require ( './things/config/config.js' ),       // 配置文件
    copy         = require ( 'gulp-copy' ),         // 拷贝文件
    minimist     = require ( 'minimist' ),          // 任务获取参数
    uglify       = require ( 'gulp-uglify' ),       // js压缩混淆
    zip          = require ( 'gulp-zip' ),          // 压缩zip
    fs           = require ( 'fs' ),                // 文件流
    cssmin       = require ( 'gulp-clean-css' ),   // css压缩
    autoprefixer = require ( 'gulp-autoprefixer' ), // css前缀追加
    htmlmin      = require ( 'gulp-htmlmin' ),      // html压缩
    imagemin     = require ( 'gulp-imagemin' ),     // 图片压缩
    rev          = require ( 'gulp-rev' ),          // 添加文件版本
    revReplace   = require ( "gulp-rev-replace" ),  // 版本文件内容替换
    removeLogs   = require ( 'gulp-removelogs' ),   // 删除console.log
    runSeque     = require ( "gulp-run-sequence" ), // 顺序执行
    path         = require ( 'path' ),
    jade         = require ( 'gulp-jade' ),
    through2     = require ( 'through2' ),
    httpProxy    = require ( 'proxy-middleware' ),
    history      = require ( './tasks/history-api-fallback' ),
    url          = require ( 'url' ),
    rename       = require ( 'gulp-rename' ),
    ngAnnotate   = require ( 'gulp-ng-annotate' ),
    //////////////////////////////////////////////////////////////////
    options      = minimist ( process.argv.slice ( 2 ) );

require ( './tasks/generatorHtml' );
var vendor = require ( './tasks/vendor' );
require ( './tasks/load-states' );
var global = {};
// vendor ( global );
var times  = 0;

function uglify_() {
    return uglify ( {
        compress: { screw_ie8: false },
        mangle  : { screw_ie8: false },
        output  : { screw_ie8: false }
    } )
}

/**
 * 默认任务
 *  执行gulp 将所有的目录结构拿去做构建,
 *  执行 gulp -p mod1 -a portal 执行指定目录结构做构建
 */
gulp.task ( 'default', function () {

    // if ( !options.p && options.a ) {
    //     throw  new Error ( 'please offer -p of arguments' );
    // }
    if ( options.p && !options.a ) {
        throw  new Error ( 'please offer -a of arguments' );
    }

    var tasks = [
        '"clean"',
        '"getInfo"',
        '"loadStates"',
        '"less"',
        '"copy"',
        '"removeLogs"',
        '"ngAnnotate"',
        '"uglify"', '"html:min"', '"css:min"', '"images:min"',
        '"doRevReplace"',
        '"requirejs:min"',
        '"seoBuild:dist"',
        '"operatorIndexHtml"',
        function () {
            doClean ( [config.getBuildBase ()] );
        }];

    eval ( 'runSeque(' + tasks.join ( ',' ) + ')' );
} );

/**
 * 执行less编译任务
 */
gulp.task ( 'less', function () {
    return gulp.src ( config.app + '/**/*.less' )

        .pipe ( less () )

        .pipe ( gulp.dest ( config.temp + '/' ) );
} );

/***
 *
 */
gulp.task ( 'jade', function () {
    var templateList = [{ name: 'baidu', href: 'http://www.baidu.com' }];
    return gulp.src ( 'things/templates/html/template.jade' )
        .pipe ( jade ( {
            data: {
                templates: templateList,
                appName  : 'Front',
                defaults : templateList[0]
            }

        } ) )
        .pipe ( gulp.dest ( 'things/templates/html/template1.html' ) );
} );

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////  Copy 拷贝任务  ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/**
 * 拷贝js下面对应的项目模板的所有文件
 */
gulp.task ( 'copy'
    , ['copy:things',
        // 'copy:view',
        'copy:styles', 'copy:images']
    , function () {
        var templateDirectory = config.getTemplateBase ( options.a, options.p ),
            buildDirectory    = config.getBuildBase ();
        return doCopy ( [
            templateDirectory + '**/*.*',
            '!' + templateDirectory + '/info.json',
            '!' + templateDirectory + '/README.MD',
            '!' + templateDirectory + '**/*.less'
        ], buildDirectory + '/' )
    } );

gulp.task ( 'copy:things', function () {

    var templateDirectory = config.getTemplateBase ( options.a, options.p ),
        buildDirectory    = config.getBuildBase ();

    return doCopy ( [
        templateDirectory + '/info.json',
        templateDirectory + '/README.MD'
    ], buildDirectory )
} );

/**
 * 将模板上面的模板拷贝到.test 文件夹下面去
 */
gulp.task ( 'copy:view', function () {
    var htmlDirectory  = config.getViewsTemplateBase ( options.a, options.p ),
        buildDirectory = config.getBuildBase ();
    return doCopy ( htmlDirectory + '**/*.html', buildDirectory + '/' + config.views + '/' + options.p );
} );

/**
 * 将模板上面的模板拷贝到.test 文件夹下面去
 */
gulp.task ( 'copy:styles', function () {
    var styleCompileDirectory = config.getStylesCompiledBase ( options.a, options.p ),
        buildDirectory        = config.getBuildBase ();
    return doCopy ( styleCompileDirectory + '**/*.css', buildDirectory );
} );

/**
 *
 */
gulp.task ( 'copy:images', function () {
    var imagesDirectory = config.getImagesBase ( options.a, options.p ),
        buildDirectory  = config.getBuildBase ();

    return doCopy ( [imagesDirectory + '**/*.*', config.getImagesBase () + '*.*'], buildDirectory + '/' + config.images );
} );

/**
 * 修改了
 */
gulp.task ( 'copy:bower_components', function () {
    if ( options.p || options.a ) {
        return gulp.src ( './README.MD' );
    }

    var copyList = ['./bower_components/**/*.*'];

    return gulp.src ( copyList )

        .pipe ( copy ( './public/bower_components', { prefix: 1 } ) );
} );

gulp.task ( 'copy:abitch', function () {
    if ( options.p || options.a ) {
        return gulp.src ( './README.MD' );
    }

    return gulp.src ( './bower_components/**/*.*' )

        .pipe ( rename ( function ( path ) {
            if ( path.extname === '.js' ) {
                path.basename = path.basename.replace ( /\.min$/, '' );
                path.extname  = ".js";
            }
        } ) )

        .pipe ( gulp.dest ( './public/bower_components' ) );
} );

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////  uglify 压缩混淆任务  //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/**
 * 在文件拷贝完成之后将文件目录下面的js压缩
 */
gulp.task ( 'uglify', function () {
    var buildDirectory = config.getBuildBase ();
    return gulp.src ( [buildDirectory + '**/*.js', '!' + buildDirectory + '**/*.app.js'] )
        .pipe ( uglify_ () )
        .pipe ( gulp.dest ( buildDirectory ) )
} );

/**
 *将requirejs 压缩
 */
gulp.task ( 'requirejs:min', function () {
    return gulp.src ( './public/bower_components/requirejs/require.js' )

        .pipe ( uglify_ () )

        .pipe ( gulp.dest ( './public/bower_components/requirejs' ) );
} );

/**
 * html压缩
 */
gulp.task ( 'html:min', function () {
    var buildDirectory = config.getBuildBase ();
    return gulp.src ( buildDirectory + '**/*.html' )
        .pipe ( htmlmin ( { collapseWhitespace: true } ) )
        .pipe ( gulp.dest ( buildDirectory ) );
} );

/**
 * 执行 autoprefixer 并且 压缩css
 */
gulp.task ( 'css:min', function () {
    var buildDirectory = config.getBuildBase ();
    return gulp.src ( buildDirectory + '**/*.css' )

        .pipe ( autoprefixer () )

        .pipe ( cssmin ( {
            //避免在清除的时候将文件路径重新定位
            rebase: false
        } ) )

        .pipe ( gulp.dest ( buildDirectory ) );
} );

/**
 * 压缩images
 */
gulp.task ( 'images:min', function () {
    var buildDirectory = config.getBuildBase ();

    var images = ['jpg', 'png', 'jpeg'],
        result = [];
    images.forEach ( function ( item ) {
        result.push ( buildDirectory + '**/*.' + item );
    } );
    return gulp.src ( result )
        .pipe ( imagemin () )
        .pipe ( gulp.dest ( buildDirectory + '/' ) )
} );

/**
 * 压缩public下面的所有文件以-p 后面的参数+version来命名
 */
gulp.task ( 'zip', function () {

    return gulp.src ( config.getPublicBase () + '**/*.*' )

        .pipe ( zip ( (options.p || config.dist) + ' .zip' ) )

        .pipe ( gulp.dest ( config.getPublicBase () ) );
} );

gulp.task ( 'ngAnnotate', function () {
    return gulp.src ( 'build/**/*.js' )

        .pipe ( ngAnnotate () )

        .pipe ( gulp.dest ( 'build' ) );
} );
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////  clean  压缩混淆任务  //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

gulp.task ( 'clean', function () {
    var deployDirectory   = config.getPublicBase (),
        templateDirectory = '.temp',
        buildDirectory    = config.getBuildBase ();

    return doClean ( [buildDirectory, deployDirectory] );
} );

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////  uglify 压缩混淆任务  //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
/**
 * 业务逻辑开发服务器
 */
gulp.task ( 'serve', ['less', 'getInfo', 'loadStates'], function () {

    var rules = [
        serveStatic ( './.temp' ),
        { route: '/portal/bower_components', handle: serveStatic ( './bower_components' ) },
        { route: '/bower_components', handle: serveStatic ( './bower_components' ) },
        { route: '/mfs', handle: serveStatic ( 'z:\\' ) },
        { route: '/portal', handle: serveStatic ( './.temp/portal' ) }
    ];

    var rewriteRules = [];
    config.proxies.forEach ( function ( proxy ) {
        var proxyOptions          = url.parse ( proxy.target + ':' + proxy.port + proxy.context );
        proxyOptions.route        = proxy.context;
        proxyOptions.preserveHost = true;
        rules.unshift ( httpProxy ( proxyOptions ) );
        rewriteRules.push ( proxy.context );
    } );
    var ruleFrom = '^(?!(.*?^\/admin)|(.*?^\/login)|(.*?^\/center)|(.*?^\/bower_components)|(.*?^\/play)|(.*?^\/mfs)';
    rewriteRules.forEach ( function ( context ) {
        ruleFrom += '|(.*?\/' + context.replace ( '/', '' ) + ')';
    } );
    ruleFrom += '|.*?(\.html|\.js|\.jpg|\.jpeg|\.json|\.png|\.php|\.css|\.woff|\.woff2|\.ttf|\.svg|\.eot)).*?$';
    rules.unshift ( history ( {
        verbose : config.rewriteRule.log,
        // disableDotRule: true,
        rewrites: [
            //
            // { from: /^\/login/, to: '/login/index.html' },
            // { from: /^\/admin/, to: '/admin/index.html' },
            // { from: /^\/center/, to: '/center/index.html' },
            // 不等于.js .html .png 不以/admin开头
            {
                from: new RegExp ( ruleFrom ),
                to  : '/portal/index.html'
            }
        ]
    } ) );

    serve ( './test/', rules, {
        port: config.dev.port
    } );

    gulp.watch ( 'app/**/*-state.js', ['loadStates'] );
    gulp.watch ( 'app/**/*.less', ['less'] );
} );

/**
 * 静态文件开发服务器
 */
gulp.task ( 'serve:static', ['generatorHtml', 'less'], function () {
    serve ( './html/', [
        serveStatic ( './html' ),
        serveStatic ( './app' ),
        serveStatic ( './.temp' ),
        { route: '/portal', handle: serveStatic ( './.temp/portal' ) }
    ], {
        port: config.static.port
    } );

    gulp.watch ( 'app/**/*.less', ['less'] );
    gulp.watch ( [config.html + '/**/*.html', '!' + config.html + '/**/index.html', '!' + config.html + '/**/index_another.html'], ['generatorHtml'] );
} );

/**
 * 静态文件开发服务器
 */
gulp.task ( 'serve:example', function () {

    var proxyOptions          = url.parse ( 'http://192.168.1.208:18080/rest' );
    proxyOptions.route        = '/rest';
    proxyOptions.host         = "192.168.1.208:18080";
    proxyOptions.via          = "尼玛";
    proxyOptions.preserveHost = true;

    serve ( './examples', [
        httpProxy ( proxyOptions ),
        { route: '/bower_components', handle: serveStatic ( './bower_components' ) }
    ], {
        port: 1212
    } );
} );

/**
 * 生产环境
 */
gulp.task ( 'serve:dist', function () {
    var rules = [
        serveStatic ( './public/portal' ),
        { route: '/bower_components', handle: serveStatic ( './bower_components' ) },
        { route: '/mfs', handle: serveStatic ( 'z:\\' ) }
        // { route: '/portal', handle: serveStatic ( './.temp/portal' ) }
    ];

    var rewriteRules = [];
    config.proxies.forEach ( function ( proxy ) {
        var proxyOptions          = url.parse ( proxy.target + ':' + proxy.port + proxy.context );
        proxyOptions.route        = proxy.context;
        proxyOptions.preserveHost = true;
        rules.unshift ( httpProxy ( proxyOptions ) );
        rewriteRules.push ( proxy.context );
    } );
    var ruleFrom = '^(?!(.*?^\/admin)|(.*?^\/login)|(.*?^\/center)|(.*?^\/bower_components)|(.*?^\/play)|(.*?^\/mfs)';
    rewriteRules.forEach ( function ( context ) {
        ruleFrom += '|(.*?\/' + context.replace ( '/', '' ) + ')';
    } );
    ruleFrom += '|.*?(\.html|\.js|\.jpg|\.jpeg|\.json|\.png|\.php|\.css)).*?$';
    rules.unshift ( history ( {
        verbose : config.rewriteRule.log,
        // disableDotRule: true,
        rewrites: [
            //
            // { from: /^\/login/, to: '/login/index.html' },
            // { from: /^\/admin/, to: '/admin/index.html' },
            // { from: /^\/center/, to: '/center/index.html' },
            // 不等于.js .html .png 不以/admin开头
            {
                from: new RegExp ( ruleFrom ),
                to  : '/portal/index.htm'
            }
        ]
    } ) );
    serve ( './public/', rules, {
        port: 3012
    } );
} );

///////////////////////
// /(([ \t]*)<!--\s*seo:build\s*-->)(\n|\r|.)*?(<!--\s*seo:endbuild\s*-->)/gi
gulp.task ( 'seoBuild:dist', function () {
    var reg      = /(seo).*?(seo)/gi,
        changeTo = '$1$2';
    return gulp.src ( config.getPublicBase () + '/portal/index.html' )

        .pipe ( (function () {
            return through2.obj ( function ( file, some, callback ) {
                var content = file.contents.toString ();
                content     = content.replace ( reg, changeTo );
                fs.writeFileSync ( config.getPublicBase () + '/portal/index.html', content, config.utfEncoding );
                callback ();
            } )
        }) () )
} );
//////////////////////

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

gulp.task ( 'removeLogs', function () {
    var buildDirectory = config.getBuildBase ();
    return gulp.src ( buildDirectory + '/**/*.js' )
        .pipe ( removeLogs () )
        .pipe ( gulp.dest ( buildDirectory + '/' ) );
} );

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/***
 * version control 版本控制
 * @type {plugin}
 */

var deployDirectory = './public/',
    buildDirectory  = './build/';

gulp.task ( 'copyImportant', function () {
    times++;
    var indexs = [];

    indexs[indexs.length] = buildDirectory + '**/info.json';
    indexs[indexs.length] = buildDirectory + '**/ignore_*.*';

    fs.readdirSync ( buildDirectory )
        .forEach ( function ( app ) {
            var fileStats = fs.statSync ( buildDirectory + app );
            if ( fileStats.isDirectory () ) {
                var name              = buildDirectory + app + '/index.html';
                indexs[indexs.length] = name;
            }
        } );
    return gulp.src ( indexs )

        .pipe ( copy ( deployDirectory, { prefix: 1 } ) )
} );

/**
 * 往info.json中添加主题内容
 */
gulp.task ( 'collectInfos', ['less'], function () {

    var styleDirectory = config.getStylesCompiledBase ( 'portal', options.p ),
        dirs_          = gulp.src ( styleDirectory + '/styles/*' ),
        directories    = [];
    dirs_.on ( 'data', function ( file ) {
        var fileStats = fs.statSync ( file.path ),
            fileName  = path.basename ( file.path );
        if ( fileStats.isDirectory () ) {
            directories.push ( fileName )
        }
    } );

    dirs_.on ( 'end', function () {
        writeDirectoryInfoToInfoJson ( directories );
    } );

    return dirs_;

    function writeDirectoryInfoToInfoJson( directories ) {

        var templateDirectory = config.getTemplateBase ( 'portal', options.p ),
            filePath          = templateDirectory + 'info.json';

        var infoJson       = fs.readFileSync ( filePath, config.utfEncoding ),
            infoJSonObject = JSON.parse ( infoJson );

        infoJSonObject.themes = {};
        directories.map ( function ( item ) {
            infoJSonObject.themes[item] = options.p + '/styles/' + item + '/' + options.p + '.css';
        } );
        fs.writeFileSync ( filePath, JSON.stringify ( infoJSonObject ), config.utfEncoding );
    }
} );

/**
 * 文件在每次压缩完成后app.js之类的文件的文件名称随之改变，
 * 避免每次改变完成后服务端的配置跟着变化。将文件内容编写置index.html内容全局变量
 */
gulp.task ( 'getInfo', function () {
    var infos = [],
        reg   = /(define\s*?\(\s*?"_app_config_infos_",\s*?function\s*?\(\)\s*?\{\s*?)(.*?)(\s*?\}\s*?\))/gi;
    return gulp.src ( config.getBase ( config.portal + '/**/info.json' ) )

        .pipe ( (function () {
            return through2.obj ( function ( file, a, call ) {
                var info = file.contents.toString ();
                info     = JSON.parse ( info );
                infos.push ( info );
                call ();
            }, function ( call ) {
                var indexContent = fs.readFileSync ( config.getBase ( config.portal + '/index.html' ), config.utfEncoding );
                indexContent     = indexContent.toString ().replace ( reg, '$1return ' + JSON.stringify ( infos ) + '$3' );
                fs.writeFileSync ( config.getBase ( config.portal + '/index.html' ), indexContent, config.utfEncoding );
                call ();
            } )
        }) () )
} );

/**
 * 重命名index.html  -- > index.htm
 */
gulp.task ( 'renameIndexHtml', function () {
    return gulp.src ( config.getPublicBase () + '/portal/index.html' )

        .pipe ( rename ( function ( path ) {
            path.extname = '.htm';
        } ) )

        .pipe ( gulp.dest ( config.getPublicBase () + '/portal' ) )
} );

gulp.task ( 'operatorIndexHtml', ['renameIndexHtml'], function () {
    return gulp.src ( config.getPublicBase () + '/portal/index.html' )

        .pipe ( clean () )
} )

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/***
 *
 * @param baseDir
 * @param middleware
 */
function serve( baseDir, middleware, options ) {
    browserSync.init ( {
        ui    : false,
        open  : false,
        port  : options.port || 3000,
        // reloadOnRestart: true,
        server: {
            baseDir   : baseDir,
            middleware: middleware || []
        }
    } );
}

/**
 *
 * 创建模块 gulp createModule -n  someName [-v 0.0.1]
 *
 *  -a for appName
 *  -n for moduleName
 */
gulp.task ( 'createModule', function () {

    var moduleName           = options.n,
        appName              = options.a,
        version              = options.v,
        replaceModuleNameReg = /\$\$moduleName\$\$/g,
        templateDirectory    = config.getTemplateBase ( appName, moduleName ),
        styleDirectory       = config.getLessBase ( appName, moduleName ),
        htmlDirectory        = config.getViewsTemplateBase ( appName, moduleName );

    /**
     *
     * @param moduleName
     * @returns {string}
     */
    function getStateContents( moduleName ) {
        return ("define ( ['$$moduleName$$/js/modules/home/main'], function ( controllers ) {" +
        "'use strict';" +
        "angular.module ( 'app.portal.states.$$moduleName$$', [] )" +
        ".config ( ['$stateProvider', function ( $stateProvider ) {" +
        "       $stateProvider.state ( 'states.$$moduleName$$', {" +
        "           url  : '/$$moduleName$$'," +
        "           views: {" +
        "               '@': {" +
        "                   templateUrl: '$$moduleName$$/views/index.html'," +
        "                   controller : 'app.portal.states.$$moduleName$$.indexCtrl'" +
        "               }" +
        "           }" +
        "       } )" +
        "   }] ) " +
        "} )").replace ( replaceModuleNameReg, moduleName );
    }

    /**
     *
     * @param moduleName
     * @returns {string}
     */
    function getNotPortalStateContents( app, moduleName ) {
        return ("define ( ['modules/$$moduleName$$/main'], function ( controllers ) {" +
        "'use strict';" +
        "angular.module ( 'app." + app + ".states.$$moduleName$$', [] )" +
        ".config ( ['$stateProvider', function ( $stateProvider ) {" +
        "       $stateProvider.state ( 'states.$$moduleName$$', {" +
        "           url  : '/$$moduleName$$'," +
        "           views: {" +
        "               '@': {" +
        "                   templateUrl: 'views/$$moduleName$$/index.html'," +
        "                   controller : 'app." + app + ".states.$$moduleName$$.indexCtrl'" +
        "               }" +
        "           }" +
        "       } )" +
        "   }] ) " +
        "} )").replace ( replaceModuleNameReg, moduleName );
    }

    /**
     *
     * @param moduleName
     * @returns {string}
     */
    function getMainContents( moduleName ) {
        return ("define ( ['$$moduleName$$/js/modules/home/controllers/$$moduleName$$-ctrl'], function ( controllers ) {" +
        "'use strict';" +
        "angular.module ( 'app.portal.states.$$moduleName$$.main', [] )" +
        ".controller ( 'app.portal.states.$$moduleName$$.indexCtrl', controllers.indexCtrl );" +
        "} );").replace ( replaceModuleNameReg, moduleName )
    }

    /**
     *
     * @param moduleName
     * @returns {string}
     */
    function getNotPortalMainContents( app, moduleName ) {
        return ("define ( ['modules/$$moduleName$$/controllers/$$moduleName$$-ctrl'], function ( controllers ) {" +
        "'use strict';" +
        "angular.module ( 'app." + app + ".states.$$moduleName$$.main', [] )" +
        ".controller ( 'app." + app + ".states.$$moduleName$$.indexCtrl', controllers.indexCtrl );" +
        "} );").replace ( replaceModuleNameReg, moduleName )
    }

    /**
     *
     * @param moduleName
     * @returns {string}
     */
    function getControllerContents( moduleName ) {
        return ('define ( function ( $$moduleName$$ ) {\n' +
        '"use strict";\n' +
        'return {\n' +
        '    indexCtrl: ["$scope", function ( $scope ) {\n' +
        '       console.log ( "$$moduleName$$" );\n' +
        '       }]\n' +
        '}' +
        '} );').replace ( replaceModuleNameReg, moduleName );
    }

    /**
     *
     */
    function createScript() {
        // 创建模块文件夹
        var portalAppJsContents = fs.readFileSync ( config.getThingsBase ( 'templates/js/portal.app.js' ), config.utfEncoding );
        fs.mkdirSync ( templateDirectory );
        // fs.writeFileSync ( templateDirectory + '/common/si.js' );
        fs.mkdirSync ( templateDirectory + '/js' );
        fs.writeFileSync ( templateDirectory + '/portal.app.js', portalAppJsContents.replace ( replaceModuleNameReg, moduleName ), config.utfEncoding );
        fs.mkdirSync ( templateDirectory + '/js/common' );
        fs.mkdirSync ( templateDirectory + '/js/modules' );
        fs.mkdirSync ( templateDirectory + '/js/modules/home' );
        fs.writeFileSync ( templateDirectory + '/js/modules/home/main.js', getMainContents ( moduleName ), config.utfEncoding );
        fs.mkdirSync ( templateDirectory + '/js/modules/home/controllers' );
        fs.writeFileSync ( templateDirectory + '/js/modules/home/controllers/' + moduleName + '-ctrl.js', getControllerContents ( moduleName ), config.utfEncoding );
        fs.mkdirSync ( templateDirectory + '/js/modules/home/services' );
        fs.mkdirSync ( templateDirectory + '/js/modules/home/directives' );

        // 状态
        fs.mkdirSync ( templateDirectory + '/js/states' );
        fs.writeFileSync ( templateDirectory + '/js/states/' + moduleName + '-state.js', getStateContents ( moduleName ), config.utfEncoding );

        // 创建重要文件
        // fs.writeFileSync ( templateDirectory + '/' + moduleName + '.app.js' );
        fs.writeFileSync ( templateDirectory + '/info.json' );
        writeInfoJson ( moduleName, options.v );
        fs.writeFileSync ( templateDirectory + '/README.MD' );
        function writeInfoJson( moduleName, version ) {
            var info = {
                name   : moduleName,
                themes : {
                    "default": moduleName + '/styles/default/' + moduleName + '.css'
                },
                main   : moduleName + '/portal.app.js',
                version: version || '0.0.1'
            };

            fs.writeFileSync ( templateDirectory + '/info.json', JSON.stringify ( info ), config.utfEncoding );
        }
    }

    function createStyle( directory ) {
        fs.mkdirSync ( directory );
        fs.mkdirSync ( directory + '/default' );
        fs.writeFileSync ( directory + '/default/' + moduleName + '.less', '', config.utfEncoding );
    }

    function createView( directory ) {
        fs.mkdirSync ( directory );
        fs.writeFileSync ( directory + 'index.html' );
    }

    function createNotPortalModule( directory ) {
        var moduleThings = directory + '/modules/' + moduleName;
        fs.mkdirSync ( moduleThings );
        fs.writeFileSync ( moduleThings + '/main.js', getNotPortalMainContents ( appName, moduleName ), config.utfEncoding );

        fs.mkdirSync ( moduleThings + '/controllers' );
        fs.writeFileSync ( moduleThings + '/controllers/' + moduleName + '-ctrl.js', getControllerContents ( moduleName ) );

        fs.writeFileSync ( directory + '/states/' + moduleName + '-state.js', getNotPortalStateContents ( appName, moduleName ), config.utfEncoding );
    }

    if ( options.a === config.portal ) {

        [{
            from: config.getThingsBase ( 'templates/js/si.js' ),
            to  : templateDirectory + '/js/common'
        }].map ( function ( item ) {
            doCopy ( item.from, item.to );
        } );
        createScript ();

        createStyle ( styleDirectory );

        createView ( htmlDirectory );

        fs.mkdirSync ( templateDirectory + '/images' );

        gulp.run ( ['loadStates', 'less'] );
    } else {

        var viewWhere = './app/' + options.a + '/views/' + options.n + '/',
            jsWhere   = './app/' + options.a + '/js/';

        createNotPortalModule ( jsWhere );

        createView ( viewWhere );

        gulp.run ( ['loadStates', 'less'] );
    }

} );

/**
 * 删除模块命令 gulp removeModule -name someName [-v 0.0.1]
 */
gulp.task ( 'removeModule', function () {
    var moduleName        = options.n,
        version           = options.v,
        templateDirectory = config.getTemplateBase ( moduleName ),
        styleDirectory    = config.getLessBase ( moduleName ),
        htmlDirectory     = config.getViewsTemplateBase ( moduleName );

    /**
     * 深层删除文件夹
     * @param path
     */
    function deleteFolderRecursive( path ) {
        var files = [];
        if ( fs.existsSync ( path ) ) {
            files = fs.readdirSync ( path );
            files.forEach ( function ( file, index ) {
                var curPath = path + "/" + file;
                if ( fs.statSync ( curPath ).isDirectory () ) { // recurse
                    deleteFolderRecursive ( curPath );
                } else { // delete file
                    fs.unlinkSync ( curPath );
                }
            } );
            fs.rmdirSync ( path );
        }
    }

    //////////////////////////////////////////
    deleteFolderRecursive ( templateDirectory );
    //////////////////////////////////////////
    deleteFolderRecursive ( styleDirectory );
    ////////////////////////////////////////
    deleteFolderRecursive ( htmlDirectory );
    ////////////////////////////////////////
} );

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/**
 * 封装拷贝方法
 * @param from
 * @param to
 * @returns {*}
 */
function doCopy( from, to ) {
    return gulp.src ( from )
        .pipe ( copy ( to, { prefix: 1 } ) );
}

/**
 * 删除文件夹
 * @param where
 * @returns {*}
 */
function doClean( where ) {
    return gulp.src ( where )

        .pipe ( clean () );
}
////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

/**
 * 帮助
 */
gulp.task ( 'help', function () {

    console.log ( ' gulp 执行默认的任务为压缩打包整个app下面的文件' );

    console.log ( ' gulp -p mod2 -a portal 执行打包app/portal/mod2 下面的内容' );

    console.log ( ' gulp createModule -n mod3 -a portal 执行创建一个新的mod3模板的任务' );

    console.log ( ' gulp loadStates 构建整个app下面的states路由配置信息' );
} );

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

gulp.task ( 'test:rev', function () {
    return runSeque ( 'rev',
        'regen-rev-manifest',
        'revreplace'
    )
} )

var fileVersion = require ( './tasks/rev/file-version.js' );

gulp.task ( 'doRevReplace', function () {

    fileVersion.doRevReplace ( {
        workPlace: 'public',
        src      : 'public'
    } );

} );
