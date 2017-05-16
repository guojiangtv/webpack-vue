// 引入操作路径模块和webpack 
var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require('extract-text-webpack-plugin') //抽离css
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

var HashedChunkIdsPlugin = require('./webpack-config/hashedChunkIdsPlugin.js')

//生产与开发环境配置
var glob = require('glob')
var prod = process.env.NODE_ENV === 'production' ? true : false //是否是生产环境

//webpack配置
var postcssConfigDir = './webpack-config/postcss.config.js'
var resolveConfigDir = './webpack-config/resolve.config.js'

//目录配置
var baseEntryDir = './static_guojiang_tv/src/mobile/v2/'
var entryDir = baseEntryDir + '**/*.js'
var outDir = path.resolve(__dirname, './static_guojiang_tv/src/mobile/v2')
var outPublicDir = 'http://static.guojiang.tv/mobile/v2/'

module.exports = {
    /* 输入文件 */
	resolve: require( resolveConfigDir ),
	entry: {
		dll: ['vue','axios','layer','weixin-js-sdk','webpack-zepto']
	},
	output: {
		path: outDir,
		publicPath: outPublicDir,
		filename: 'js/lib/[name].js?v=[chunkhash:8]',
		library: '[name]_library'
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					postcss: [require( postcssConfigDir )]
				}
			},
			{
				test: /\.ejs$/,
				loader: 'ejs-loader'
			},
			{
				test: /\.js$/,
				enforce: 'pre',
				loader: 'eslint-loader',
				include: path.resolve(__dirname, entryDir),
				exclude: [baseEntryDir + 'js/lib', baseEntryDir + 'js/component'],
				options: {
					fix: true
				}
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
        		exclude: ['node_modules', baseEntryDir + 'js/lib', baseEntryDir + 'js/component']
			},
			{   
        		test: /\.css$/, 
				use: ['style-loader', 'css-loader', 'postcss-loader'],
				exclude: [baseEntryDir + 'css/lib']
			},
			{
				test: /\.less$/,
				use: ExtractTextPlugin.extract(['css-loader','postcss-loader','less-loader']),
			},
			{
				test: /\.(png|jpg|gif)$/,
				loader: 'url-loader',
				options: {
					limit: 512,
					name: function(p){
						let tem_path = p.split(/\\img\\/)[1]
						tem_path = tem_path.replace(/\\/g,'/')

						return 'img/'+tem_path + '?v=[hash:8]'
					}
				}
			},
			{
				test: /\.html$/,
				use: [ {
					loader: 'html-loader',
					options: {
						minimize: true
					}
				}],
			}
		]
	},
	plugins: [
		new HashedChunkIdsPlugin(),
		new webpack.HashedModuleIdsPlugin(),
		new webpack.DllPlugin({
	      path: 'manifest.json', // 本Dll文件中各模块的索引，供DllReferencePlugin读取使用
	      name: '[name]_library',  // 当前Dll的所有内容都会存放在这个参数指定变量名的一个全局变量下，注意与参数output.library保持一致
	      context: __dirname, // 指定一个路径作为上下文环境，需要与DllReferencePlugin的context参数保持一致，建议统一设置为项目根目录
	    }),
		new ExtractTextPlugin('css/[name].css?v=[contenthash:8]'),
    
		new webpack.LoaderOptionsPlugin({
			options: {
				postcss: require( postcssConfigDir )
			},
		})
	]
}



/***** 区分开发环境和生产环境 *****/

if (prod) {
	console.log('当前编译环境：production')

	//module.exports.devtool = 'module-cheap-source-map'
	module.exports.plugins = module.exports.plugins.concat([
		//new CleanWebpackPlugin(['dist']),
    	//压缩css代码
		new OptimizeCssAssetsPlugin({
			assetNameRegExp: /\.css\.*(?!.*map)/g,  //注意不要写成 /\.css$/g
			cssProcessor: require('cssnano'),
			cssProcessorOptions: { discardComments: {removeAll: true } },
			canPrint: true
		}),
 		//压缩JS代码
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			},
			//sourceMap: true,
			output: {
				comments: false, // 去掉注释内容
			}
		})
	])
} else {  
	console.log('当前编译环境：dev')

	module.exports.devtool = 'cheap-module-source-map'
}