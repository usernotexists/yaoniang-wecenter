var AWS =
{
	//全局loading
	loading: function (type)
	{
		if (!$('#aw-loading').length)
		{
			$('#aw-ajax-box').append(AW_TEMPLATE.loadingBox);
		}

		if (type == 'show')
		{
			if ($('#aw-loading').css('display') == 'block')
			{
				return false;
			}

			$('#aw-loading').fadeIn();

			AWS.G.loading_timer = setInterval(function ()
			{
				AWS.G.loading_bg_count -= 1;

				$('#aw-loading-box').css('background-position', '0px ' + AWS.G.loading_bg_count * 40 + 'px');

				if (AWS.G.loading_bg_count == 1)
				{
					AWS.G.loading_bg_count = 12;
				}
			}, 100);
		}
		else
		{
			$('#aw-loading').fadeOut();

			clearInterval(AWS.G.loading_timer);
		}
	},

	loading_mini: function (selector, type)
	{
		if (!selector.find('#aw-loading-mini-box').length)
		{
			selector.append(AW_TEMPLATE.loadingMiniBox);
		}

		if (type == 'show')
		{
			selector.find('#aw-loading-mini-box').fadeIn();

			AWS.G.loading_timer = setInterval(function ()
			{
				AWS.G.loading_mini_bg_count -= 1;

				$('#aw-loading-mini-box').css('background-position', '0px ' + AWS.G.loading_mini_bg_count * 16 + 'px');

				if (AWS.G.loading_mini_bg_count == 1)
				{
					AWS.G.loading_mini_bg_count = 9;
				}
			}, 100);
		}
		else
		{
			selector.find('#aw-loading-mini-box').fadeOut();

			clearInterval(AWS.G.loading_timer);
		}
	},

	// ajax post
	ajax_rsm: function(url, params, callback)
	{
		AWS.loading('show');

		if (typeof params == 'object')
		{
			params['_post_type'] = 'ajax';
		}
		else
		{
			params += '&_post_type=ajax';
		}

		$.post(url, params, function (result)
		{
			AWS.loading('hide');
			_callback(result);
		}, 'json').error(function (error)
		{
			AWS.loading('hide');
			_error(error);
		});

		function _callback (result)
		{
			if (!result)
			{
				alert(_t('未知错误'));
				callback && callback('error');
				return;
			}

			if (result.err)
			{
				AWS.alert(result.err);
				callback && callback('error');
				return;
			}

			callback && callback(null, result.rsm);
		}

		function _error (error)
		{
			alert(_t('接口错误') + ' ' + error.responseText);
			callback && callback('error');
			return;
		}
	},

	ajax_request: function(url, params, no_reload)
	{
		AWS.loading('show');

		if (params)
		{
			if (typeof params == 'object')
			{
				params['_post_type'] = 'ajax';
			}
			else
			{
				params += '&_post_type=ajax';
			}
			$.post(url, params, function (result)
			{
				_callback(result);
			}, 'json').error(function (error)
			{
				_error(error);
			});
		}
		else
		{
			$.get(url, function (result)
			{
				_callback(result);
			}, 'json').error(function (error)
			{
				_error(error);
			});
		}

		function _callback (result)
		{
			AWS.loading('hide');

			if (!result)
			{
				return false;
			}

			if (result.err)
			{
				AWS.alert(result.err);
			}
			else if (result.rsm && result.rsm.url)
			{
				window.location = decodeURIComponent(result.rsm.url);
			}
			else if (result.errno == 1)
			{
				no_reload || window.location.reload();
			}
		}

		function _error (error)
		{
			AWS.loading('hide');

			if ($.trim(error.responseText) != '')
			{
				alert(_t('发生错误, 返回的信息:') + ' ' + error.responseText);
			}
		}

		return false;
	},


	submit_form: function(form_el, btn_el, err_el, callback)
	{
		// 若有编辑器的话就从编辑器更新内容再提交
		if (G_ADVANCED_EDITOR_ENABLE == 'Y')
		{
			form_el.find('textarea').each(function()
			{
				if (this._sceditor)
				{
					this._sceditor.updateOriginal();
				}
			});
		}

		AWS.loading('show');

		if (btn_el)
		{
			btn_el.addClass('disabled');
		}

		var custom_data = {
			_post_type: 'ajax'
		};

		form_el.ajaxSubmit(
		{
			dataType: 'json',
			data: custom_data,
			success: function (result)
			{
				AWS.loading('hide');
				if (btn_el)
				{
					btn_el.removeClass('disabled');
				}
				if (!result)
				{
					alert(_t('未知错误'));
					callback && callback('error');
					return;
				}
				if (result.errno == 1) // success
				{
					if (result.rsm && result.rsm.url)
					{
						window.location = decodeURIComponent(result.rsm.url);
					}
					else if (callback)
					{
						form_el.find('textarea').each(function()
						{
							$(this).val('');
							if (G_ADVANCED_EDITOR_ENABLE == 'Y')
							{
								if (this._sceditor)
								{
									this._sceditor.val('');
								}
							}
						});
						callback(null, result.rsm);
					}
					else
					{
						window.location.reload();
					}
				}
				else
				{
					if (!err_el || !err_el.length)
					{
						AWS.alert(result.err);
					}
					else
					{
						if (err_el.find('em').length)
						{
							err_el.find('em').html(result.err);
						}
						else
						{
							err_el.html(result.err);
						}
						if (err_el.css('display') != 'none')
						{
							AWS.shake(err_el);
						}
						else
						{
							err_el.fadeIn();
						}
					}
					callback && callback('error');
				}
			},
			error: function (error)
			{
				console.log(error);
				AWS.loading('hide');
				if (btn_el)
				{
					btn_el.removeClass('disabled');
				}
				if ($.trim(error.responseText) != '')
				{
					alert(_t('发生错误, 返回的信息:') + ' ' + error.responseText);
				}
				else if (error.status == 0)
				{
					alert(_t('网络连接异常'));
				}
				else if (error.status == 500)
				{
					alert(_t('内部服务器错误'));
				}
				callback && callback('error');
			}
		});
	},

	submit: function(form_el, btn_el, callback)
	{
		AWS.submit_form(form_el, btn_el, null, callback);
	},

	submit_append: function(form_el, btn_el, append_el, callback)
	{
		AWS.submit_form(form_el, btn_el, null, function(err, rsm)
		{
			if (err)
			{
				callback && callback(err);
				return;
			}
			if (append_el && append_el.length)
			{
				if (rsm && rsm.ajax_html)
				{
					append_el.append(rsm.ajax_html);
					var el_id = $(rsm.ajax_html).attr('id');
					if (el_id)
					{
						$.scrollTo($('#' + el_id), 600, {queue:true});
					}
				}
			}
			callback && callback(null, rsm);
		});
	},

	// 加载更多
	load_list_view: function(url, selector, container, start_page, callback)
	{
		if (!selector.attr('id'))
		{
			return false;
		}

		if (!start_page)
		{
			start_page = 0
		}

		// 把页数绑定在元素上面
		if (selector.attr('data-page') == undefined)
		{
			selector.attr('data-page', start_page);
		}
		else
		{
			selector.attr('data-page', parseInt(selector.attr('data-page')) + 1);
		}

		selector.bind('click', function ()
		{
			var _this = this;

			$(this).addClass('loading');

			$.get(url + '__page-' + $(_this).attr('data-page'), function (result)
			{
				$(_this).removeClass('loading');

				if ($.trim(result) != '')
				{
					if ($(_this).attr('data-page') == start_page && $(_this).attr('auto-load') != 'false')
					{
						container.html(result);
					}
					else
					{
						container.append(result);
					}

					// 页数增加1
					$(_this).attr('data-page', parseInt($(_this).attr('data-page')) + 1);
				}
				else
				{
					//没有内容
					if ($(_this).attr('data-page') == start_page && $(_this).attr('auto-load') != 'false')
					{
						container.html('<p style="padding: 15px 0" align="center">' + _t('没有内容') + '</p>');
					}

					$(_this).addClass('disabled').unbind('click').bind('click', function () { return false; });

					$(_this).find('span').html(_t('没有更多了'));
				}

				if (callback != null)
				{
					callback();
				}
			});

			return false;
		});

		// 自动加载
		if (selector.attr('auto-load') != 'false')
		{
			selector.click();
		}
	},

	// 重新加载讨论列表
	reload_comments_list: function(item_id, element_id, type_name)
	{
		$('#aw-comment-box-' + type_name + '-' + element_id + ' .aw-comment-list').html('<p align="center" class="aw-padding10"><i class="aw-loading"></i></p>');

		if (type_name == 'question')
		{
			var ajax_url = G_BASE_URL + '/question/ajax/get_question_discussions/question_id-' + item_id;
		}
		else if (type_name == 'answer')
		{
			ajax_url = G_BASE_URL + '/question/ajax/get_answer_discussions/answer_id-' + item_id;
		}
		$.get(ajax_url, function (data)
		{
			$('#aw-comment-box-' + type_name + '-' + element_id + ' .aw-comment-list').html(data);
		});
	},

	// 提交表单并跳转
	submit_redirect: function(url, data, method, target)
	{
		data = data || {};
		method = method || 'post';
		target = target || '_top';
		var form = $('<form>', {
			action: url,
			method: method,
			target: target
		});
		for (var key in data) {
			form.append($('<input>', {
				name: key,
				value: data[key],
				type: 'hidden'
			}));
		}
		form.appendTo('body').submit().remove();
	},

	// 警告弹窗
	alert: function (text)
	{
		$('.alert-box').remove();
		$('.modal-backdrop').remove();

		$('#aw-ajax-box').append(Hogan.compile(AW_TEMPLATE.alertBox).render(
		{
			message: text
		}));

		$(".alert-box").modal('show');
	},

	// 确认弹窗
	confirm: function (text, callback)
	{
		$('.alert-box').remove();
		$('.modal-backdrop').remove();

		$('#aw-ajax-box').append(Hogan.compile(AW_TEMPLATE.confirmBox).render(
		{
			message: text
		}));

		$('.aw-confirm-box .yes').click(function()
		{
			$(".alert-box").modal('hide');
			if (callback)
			{
				callback();
			}
			return false;
		});

		$(".alert-box").modal('show');
	},

	// 单行输入框弹窗
	prompt: function (title, message, callback)
	{
		$('.alert-box').remove();
		$('.modal-backdrop').remove();

		$('#aw-ajax-box').append(Hogan.compile(AW_TEMPLATE.promptBox).render(
		{
			title: title,
			message: message
		}));

		$('.aw-prompt-box .yes').click(function()
		{
			$(".alert-box").modal('hide');
			if (callback)
			{
				callback($('.aw-prompt-box input').val());
			}
			return false;
		});

		$(".alert-box").modal('show');
	},

	// 多行输入框弹窗
	textBox: function (title, message, callback)
	{
		$('.alert-box').remove();
		$('.modal-backdrop').remove();

		$('#aw-ajax-box').append(Hogan.compile(AW_TEMPLATE.textBox).render(
		{
			title: title,
			message: message
		}));

		$('.aw-text-box .yes').click(function()
		{
			$(".alert-box").modal('hide');
			if (callback)
			{
				callback($('.aw-text-box textarea').val());
			}
			return false;
		});

		$(".alert-box").modal('show');
	},

	popup: function (url, callback)
	{
		$.get(url, function (template) {
			$('.alert-box').remove();
			$('.modal-backdrop').remove();

			$('#aw-ajax-box').html(template).show();

			if (callback)
			{
				callback();
			}

			$(".alert-box").modal('show');
		});
	},


	// 兼容placeholder
	check_placeholder: function(selector)
	{
		$.each(selector, function()
		{
			if (typeof ($(this).attr("placeholder")) != "undefined")
			{
				$(this).attr('data-placeholder', 'true');

				if ($(this).val() == '')
				{
					$(this).addClass('aw-placeholder').val($(this).attr("placeholder"));
				}

				$(this).focus(function () {
					if ($(this).val() == $(this).attr('placeholder'))
					{
						$(this).removeClass('aw-placeholder').val('');
					}
				});

				$(this).blur(function () {
					if ($(this).val() == '')
					{
						$(this).addClass('aw-placeholder').val($(this).attr('placeholder'));
					}
				});
			}
		});
	},

	// 回复背景高亮
	hightlight: function(selector, class_name)
	{
		if (selector.hasClass(class_name))
		{
			return true;
		}

		var hightlight_timer_front = setInterval(function ()
		{
			selector.addClass(class_name);
		}, 500);

		var hightlight_timer_background = setInterval(function ()
		{
			selector.removeClass(class_name);
		}, 600);

		setTimeout(function ()
		{
			clearInterval(hightlight_timer_front);
			clearInterval(hightlight_timer_background);

			selector.addClass(class_name);
		}, 1200);

		setTimeout(function ()
		{
			selector.removeClass(class_name);
		}, 6000);
	},

	nl2br: function(str)
	{
		return str.replace(new RegExp("\r\n|\n\r|\r|\n", "g"), "<br />");
	},

	content_switcher: function(hide_el, show_el)
	{
		hide_el.hide();
		show_el.fadeIn();
	},

	htmlspecialchars: function(text)
	{
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	},

	/*
	 * 用户头像提示box效果
	 *  @params
	 *  type : user/topic
	 *	nTop    : 焦点到浏览器上边距
	 *	nRight  : 焦点到浏览器右边距
	 *	nBottom : 焦点到浏览器下边距
	 *	left    : 焦点距离文档左偏移量
	 *	top     : 焦点距离文档上偏移量
	 **
	 */
	show_card_box: function(selector, type, time) //selector -> .aw-user-name/.topic-tag
	{
		if (!time)
		{
			var time = 300;
		}

		$(document).on('mouseover', selector, function ()
		{
			clearTimeout(AWS.G.card_box_hide_timer);
			var _this = $(this);
			AWS.G.card_box_show_timer = setTimeout(function ()
			{
				//判断用户id or 话题id 是否存在
				if (_this.attr('data-id'))
				{
					 switch (type)
					{
						case 'user' :
							//检查是否有缓存
							if (AWS.G.cashUserData.length == 0)
							{
								_getdata('user', '/people/ajax/user_info/uid-');
							}
							else
							{
								var flag = 0;
								//遍历缓存中是否含有此id的数据
								_checkcash('user');
								if (flag == 0)
								{
									_getdata('user', '/people/ajax/user_info/uid-');
								}
							}
						break;

						case 'topic' :
							//检查是否有缓存
							if (AWS.G.cashTopicData.length == 0)
							{
								_getdata('topic', '/topic/ajax/topic_info/topic_id-');
							}
							else
							{
								var flag = 0;
								//遍历缓存中是否含有此id的数据
								_checkcash('topic');
								if (flag == 0)
								{
									_getdata('topic', '/topic/ajax/topic_info/topic_id-');
								}
							}
						break;
					}
				}

				//获取数据
				function _getdata(type, url)
				{
					if (type == 'user')
					{
						$.get(G_BASE_URL + url + _this.attr('data-id'), function(result)
						{
							var focus = result.focus, focusTxt;

							if (focus == 1)
							{
								focus = 'active';
								focusTxt = '取消关注';
							}
							else
							{
								focus = '';
								focusTxt = '关注';
							}

							var verified_style = '';
							var verified_title = '';
							if (result.verified)
							{
								verified_style = 'aw-verified';
								verified_title = result.verified;
							}

              switch(result.sex)
              {
                case 1:
                  result.sex = '♂';
                  break;
                case 2:
                  result.sex = '♀';
                  break;
                case 4:
                  result.sex = 'MTF';
                  break;
                case 5:
                  result.sex = 'FTM';
                  break;
                case 6:
                  result.sex = 'CD';
                  break;
                case 7:
                  result.sex = 'NB';
                  break;
                case 8:
                  result.sex = 'Q';
                  break;
                case 9:
                  result.sex = 'I';
                  break;
                default:
                  result.sex = '';
              }

							//动态插入盒子
							$('#aw-ajax-box').html(Hogan.compile(AW_TEMPLATE.userCard).render(
							{
								'verified_style' : verified_style,
								'verified_title' : verified_title,
								'uid': result.uid,
								'avatar_file': result.avatar_file,
								'user_name': result.user_name,
								'reputation': result.reputation,
								'agree_count': result.agree_count,
								'signature': result.signature,
								'url' : result.url,
								'focus': focus,
								'focusTxt': focusTxt,
								'pm_disabled': result.pm_disabled,
								'fansCount': result.fans_count,
								'sex': result.sex
							}));

							//判断是否为游客or自己
							if (G_USER_ID == '' || G_USER_ID == result.uid || result.uid < 0)
							{
								$('#aw-card-tips .mod-footer').hide();
							}
							_init();
							//缓存
							AWS.G.cashUserData.push($('#aw-ajax-box').html());
						}, 'json');
					}
					if (type == 'topic')
					{
						$.get(G_BASE_URL + url + _this.attr('data-id'), function(result)
						{
							var focus = result.focus,
								focusTxt;
								if (focus == false)
								{
									focus = '';
									focusTxt = _t('关注');
								}
								else
								{
									focus = 'active';
									focusTxt = _t('取消关注');
								}
								//动态插入盒子
								$('#aw-ajax-box').html(Hogan.compile(AW_TEMPLATE.topicCard).render(
								{
									'topic_id': result.topic_id,
									'topic_pic': result.topic_pic,
									'topic_title': result.topic_title,
									'topic_description': result.topic_description,
									'discuss_count': result.discuss_count,
									'focus_count': result.focus_count,
									'focus': focus,
									'focusTxt': focusTxt,
									'url' : result.url,
									'fansCount': result.fans_count
								}));
								//判断是否为游客
								if (G_USER_ID == '')
								{
									$('#aw-card-tips .mod-footer .follow').hide();
								}
								_init();
								//缓存
								AWS.G.cashTopicData.push($('#aw-ajax-box').html());
						}, 'json');
					}
				}

				//检测缓存
				function _checkcash(type)
				{
					if (type == 'user')
					{
						$.each(AWS.G.cashUserData, function (i, a)
						{
							if (a.match('data-id="' + _this.attr('data-id') + '"'))
							{
								$('#aw-ajax-box').html(a);
								$('#aw-card-tips').removeAttr('style');
								_init();
								flag = 1;
							}
						});
					}
					if (type == 'topic')
					{

						$.each(AWS.G.cashTopicData, function (i, a)
						{
							if (a.match('data-id="' + _this.attr('data-id') + '"'))
							{
								$('#aw-ajax-box').html(a);
								$('#aw-card-tips').removeAttr('style');
								_init();
								flag = 1;
							}
						});
					}
				}

				//初始化
				function _init()
				{
					var left = _this.offset().left,
						top = _this.offset().top + _this.height() + 5,
						nTop = _this.offset().top - $(window).scrollTop();

					//判断下边距离不足情况
					if (nTop + $('#aw-card-tips').innerHeight() > $(window).height())
					{
						top = _this.offset().top - ($('#aw-card-tips').innerHeight()) - 10;
					}

					//判断右边距离不足情况
					if (left + $('#aw-card-tips').innerWidth() > $(window).width())
					{
						left = _this.offset().left - $('#aw-card-tips').innerWidth() + _this.innerWidth();
					}

					$('#aw-card-tips').css(
					{
						left: left,
						top: top
					}).fadeIn();
				}
			}, time);
		});

		$(document).on('mouseout', selector, function ()
		{
			clearTimeout(AWS.G.card_box_show_timer);
			AWS.G.card_box_hide_timer = setTimeout(function ()
			{
				$('#aw-card-tips').fadeOut();
			}, 600);
		});
	},

	// 错误提示效果
	shake: function(selector)
	{
		var length = 6;
		selector.css('position', 'relative');
		for (var i = 1; i <= length; i++)
		{
			if (i % 2 == 0)
			{
				if (i == length)
				{
					selector.animate({ 'left': 0 }, 50);
				}
				else
				{
					selector.animate({ 'left': 10 }, 50);
				}
			}
			else
			{
				selector.animate({ 'left': -10 }, 50);
			}
		}
	}
}

AWS.format_date = function(timestamp)
{
	var d = new Date(timestamp);
	return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

// 计算延迟显示
AWS.init_later_time_helper = function($input, $label)
{
	if (!$input.length || !$label.length)
	{
		return;
	}
	$input.on('input change', function(e)
	{
		var time = '';
		var minutes = parseInt($input.val());
		if (minutes && minutes > 0) {
			time = Date.now() + minutes * 60 * 1000;
			time = AWS.format_date(time);
		}
		$label.text(time);
	});
}


AWS.init_answer_editor = function()
{
	if (G_ADVANCED_EDITOR_ENABLE == 'Y')
	{
		// 初始化编辑器
		AWS.create_editor(document.getElementById('editor_reply'));
	}
}

// 创建编辑器
AWS.create_editor = function(el, max_btn)
{
	if (!el) return;
	if (G_ADVANCED_EDITOR_ENABLE != 'Y') return;

	var empty_handler = {
		format: function (element, content) {
			return content;
		},
		html: function(token, attrs, content) {
			return content;
		}
	};
	sceditor.formats.bbcode.set('hr', empty_handler);
	sceditor.formats.bbcode.set('email', empty_handler);
	sceditor.formats.bbcode.set('font', empty_handler);
	sceditor.formats.bbcode.set('size', empty_handler);
	sceditor.formats.bbcode.set('color', empty_handler);
	sceditor.formats.bbcode.set('table', empty_handler);
	sceditor.formats.bbcode.set('rtl', empty_handler);
	sceditor.formats.bbcode.set('ltr', empty_handler);
	sceditor.formats.bbcode.set('left', empty_handler);
	sceditor.formats.bbcode.set('right', empty_handler);
	sceditor.formats.bbcode.set('justify', empty_handler);

	return sceditor.create(el, {
		width: '100%',
		resizeEnabled: false,
		emoticonsEnabled: false,
		format: 'bbcode',
		icons: 'material',
		style: G_STATIC_URL + '/editor/sceditor/themes/content/default.css',
		toolbar: 'bold,italic,underline,strike|' +
			'left,center|' +
			'bulletlist,orderedlist|' +
			'code,quote|image,link,unlink|' +
			'source' + (max_btn ? '|maximize' : '')
	});
};

// 全局变量
AWS.G =
{
	cashUserData: [],
	cashTopicData: [],
	card_box_hide_timer: '',
	card_box_show_timer: '',
	dropdown_list_xhr: '',
	loading_timer: '',
	loading_bg_count: 12,
	loading_mini_bg_count: 9,
	notification_timer: ''
}

AWS.User =
{
	// 关注
	follow: function(selector, type, data_id)
	{
		if (selector.html())
		{
			if (selector.hasClass('active'))
			{
				selector.find('span').html(_t('关注'));

				selector.find('b').html(parseInt(selector.find('b').html()) - 1);
			}
			else
			{
				selector.find('span').html(_t('取消关注'));

				selector.find('b').html(parseInt(selector.find('b').html()) + 1);
			}
		}
		else
		{
			if (selector.hasClass('active'))
			{
				selector.attr('data-original-title', _t('关注'));
			}
			else
			{
				selector.attr('data-original-title', _t('取消关注'));
			}
		}

		selector.addClass('disabled');

		switch (type)
		{
			case 'question':
				var url = '/question/ajax/focus/';

				var data = {
					'question_id': data_id
				};

				break;

			case 'topic':
				var url = '/topic/ajax/focus_topic/';

				var data = {
					'topic_id': data_id
				};

				break;

			case 'user':
				var url = '/follow/ajax/follow_people/';

				var data = {
					'uid': data_id
				};

				break;
		}

		$.post(G_BASE_URL + url, data, function (result)
		{
			if (result.errno == 1)
			{
				if (result.rsm.type == 'add')
				{
					selector.addClass('active');
				}
				else
				{
					selector.removeClass('active');
				}
			}
			else
			{
				if (result.err)
				{
					AWS.alert(result.err);
				}

				if (result.rsm.url)
				{
					window.location = decodeURIComponent(result.rsm.url);
				}
			}

			selector.removeClass('disabled');

		}, 'json');
	},

	share_out: function(options)
	{
		var title = $('title').text();
		var url = window.location.href;
		AWS.textBox(_t('分享'), title + '\r\n' + url);
	},

	// 删除别人邀请我回复的问题
	question_invite_delete: function(selector, question_invite_id)
	{
		$.post(G_BASE_URL + '/question/ajax/question_invite_delete/', 'question_invite_id=' + question_invite_id, function (result)
		{
			if (result.errno == 1)
			{
				selector.fadeOut();
			}
			else
			{
				AWS.alert(result.rsm.err);
			}
		}, 'json');
	},

	// 邀请用户回答问题
	invite_user: function(selector, img)
	{
		$.post(G_BASE_URL + '/question/ajax/save_invite/',
		{
			'question_id': QUESTION_ID,
			'uid': selector.attr('data-id')
		}, function (result)
		{
			if (result.errno != -1)
			{
				if (selector.parents('.aw-invite-box').find('.invite-list a').length == 0)
				{
					selector.parents('.aw-invite-box').find('.invite-list').show();
				}
				selector.parents('.aw-invite-box').find('.invite-list').append(' <a class="aw-small-text invite-list-user" data-toggle="tooltip" data-placement="bottom" data-original-title="'+ selector.attr('data-value') +'"><img src='+ img +' /></a>');
				selector.addClass('active').attr('onclick','AWS.User.disinvite_user($(this))').text('取消邀请');
				selector.parents('.aw-question-detail').find('.aw-invite-reply .badge').text(parseInt(selector.parents('.aw-question-detail').find('.aw-invite-reply .badge').text()) + 1);
			}
			else if (result.errno == -1)
			{
				AWS.alert(result.err);
			}
		}, 'json');
	},

	// 取消邀请用户回答问题
	disinvite_user: function(selector)
	{
		$.get(G_BASE_URL + '/question/ajax/cancel_question_invite/question_id-' + QUESTION_ID + "__recipients_uid-" + selector.attr('data-id'), function (result)
		{
			if (result.errno != -1)
			{
				$.each($('.aw-question-detail .invite-list a'), function (i, e)
				{
					if ($(this).attr('data-original-title') == selector.parents('.main').find('.aw-user-name').text())
					{
						$(this).detach();
					}
				});
				selector.removeClass('active').attr('onclick','AWS.User.invite_user($(this),$(this).parents(\'li\').find(\'img\').attr(\'src\'))').text('邀请');
				selector.parents('.aw-question-detail').find('.aw-invite-reply .badge').text(parseInt(selector.parents('.aw-question-detail').find('.aw-invite-reply .badge').text()) - 1);
				if (selector.parents('.aw-invite-box').find('.invite-list').children().length == 0)
				{
					selector.parents('.aw-invite-box').find('.invite-list').hide();
				}
			}
		});
	},

	// 提交讨论
	save_comment: function(selector)
	{
		AWS.submit(selector.parents('form'), selector, function(err, rsm)
		{
			if (err) return;
			AWS.reload_comments_list(rsm.item_id, rsm.item_id, rsm.type_name);
			$('#aw-comment-box-' + rsm.type_name + '-' + rsm.item_id + ' form textarea').css('height', '34px');
		});
	},

	// 删除讨论
	remove_comment: function(selector, type, comment_id)
	{
		$.get(G_BASE_URL + '/question/ajax/remove_comment/type-' + type + '__comment_id-' + comment_id);

		selector.parents('.aw-comment-box li').fadeOut();
	},

	why_fold: function(reason)
	{
		if (reason == -1)
			reason = _t('用户被封禁');
		else if (reason == -2)
			reason = _t('收到太多反对');
		else
			reason = _t('管理员折叠');

		AWS.alert(reason);
	},

	edit_verified_title: function(uid, text)
	{
		AWS.textBox(_t('头衔'), text, function(text)
		{
			text = encodeURIComponent(text.trim());
			AWS.ajax_request(G_BASE_URL + '/user/ajax/edit_verified_title/' , 'uid=' + uid + '&text=' + text);
		});
	},

	edit_signature: function(uid, text)
	{
		AWS.textBox(_t('签名'), text, function(text)
		{
			text = encodeURIComponent(text.trim());
			AWS.ajax_request(G_BASE_URL + '/user/ajax/edit_signature/' , 'uid=' + uid + '&text=' + text);
		});
	},

	toggle_vote: function(selector, type, operation, item_id)
	{
		var $ui = $(selector).parents('.aw-vote-ui');
		var $agree_btn = $ui.find('.agree');
		var $disagree_btn = $ui.find('.disagree');
		var $count = $ui.find('.count');
		// 初始状态
		var initial_count = parseInt($count.html());
		var initial_status = 0;
		if ($agree_btn.hasClass('active')) initial_status = 1;
		if ($disagree_btn.hasClass('active')) initial_status = -1;
		// 当前状态
		var status = initial_status;

		var set_btns = function(status) {
			if (status == 1) {
				$agree_btn.addClass('active');
				$disagree_btn.removeClass('active');
				return;
			}
			if (status == -1) {
				$agree_btn.removeClass('active');
				$disagree_btn.addClass('active');
				return;
			}
			$agree_btn.removeClass('active');
			$disagree_btn.removeClass('active');
		};

		var toggle_ui = function(callback) {
			// 还原
			if (status != initial_status) {
				set_btns(initial_status);
				$count.html(initial_count);
				status = initial_status;
				callback && callback();
				return;
			}

			// 取消赞同
			if (initial_status == 1) {
				set_btns(0);
				$count.html(initial_count - 1);
				status = 0;
				callback && callback();
				return;
			}

			// 取消反对
			if (initial_status == -1) {
				set_btns(0);
				$count.html(initial_count + 1);
				status = 0;
				callback && callback();
				return;
			}

			// 赞同/反对
			if (initial_status == 0) {
				if (operation == 'agree') {
					set_btns(1);
					$count.html(initial_count + 1);
					status = 1;
					callback && callback();
					return;
				}
				if (operation == 'disagree') {
					AWS.confirm(_t('确认反对?'), function() {
						set_btns(-1);
						$count.html(initial_count - 1);
						status = -1;
						callback && callback();
						return;
					});
				}
			}
		};

		toggle_ui(function() {
			$.post(G_BASE_URL + '/vote/ajax/' + operation + '/', 'type=' + type + '&item_id=' + item_id, function(result) {
				if (result.errno != '1') {
					AWS.alert(result.err);
					toggle_ui();
				}
			}, 'json');
		});
	},

	ask_user: function(ask_user_id, ask_user_name)
	{
		AWS.submit_redirect(G_BASE_URL + '/publish/', {ask_user_id: ask_user_id, ask_user_name: ask_user_name});
	},

	add_favorite: function(item_type, item_id)
	{
		AWS.confirm(_t('确认收藏?'), function() {
			AWS.ajax_rsm(G_BASE_URL + '/favorite/ajax/add_favorite/', {
				'item_id' : item_id,
				'item_type' : item_type
			}, function(err) {
				if (err) return;
				AWS.alert(_t('已收藏的内容可以在「动态 - 我的收藏」里找到'));
			});
		});
	},

	compose_message: function(recipient, disabled)
	{
		AWS.popup(G_BASE_URL + '/inbox/edit/compose/', function() {
			if (recipient) {
				recipient = AWS.htmlspecialchars(recipient);
				$('#personal_message_recipient').val(recipient);
			}
			if (disabled) {
				$('#personal_message_recipient').attr('readonly', true);
				$('#personal_message_content').attr('readonly', true);
				$('#personal_message_submit').addClass('disabled');
			} else {
				AWS.Dropdown.bind_dropdown_list($('#personal_message_recipient'), 'inbox');
				//私信用户下拉点击事件
				$(document).on('click','.aw-inbox .aw-dropdown-list li a',function() {
					$('#personal_message_form input.form-control').val($(this).text());
					$(this).parents('.aw-dropdown').hide();
				});
			}
		});
	},
}

AWS.Dropdown =
{
	// 下拉菜单功能绑定
	bind_dropdown_list: function(selector, type)
	{
		if (type == 'search')
		{
			$(selector).focus(function()
			{
				$(selector).parent().find('.aw-dropdown').show();
			});
		}
		$(selector).keyup(function(e)
		{
			if (type == 'search')
			{
				$(selector).parent().find('.search').show().children('a').text($(selector).val());
			}
			if ($(selector).val().length >= 1)
			{
				if (e.which != 38 && e.which != 40 && e.which != 188 && e.which != 13)
				{
					AWS.Dropdown.get_dropdown_list($(this), type, $(selector).val());
				}
			}
			else
			{
			   $(selector).parent().find('.aw-dropdown').hide();
			}

			if (type == 'topic')
			{
				// 逗号或回车提交
				if (e.which == 188)
				{
					if ($('.aw-edit-topic-box #aw_edit_topic_title').val() != ',')
					{
						$('.aw-edit-topic-box #aw_edit_topic_title').val( $('.aw-edit-topic-box #aw_edit_topic_title').val().substring(0,$('.aw-edit-topic-box #aw_edit_topic_title').val().length-1));
						$('.aw-edit-topic-box .aw-dropdown').hide();
						$('.aw-edit-topic-box .add').click();
					}
					return false;
				}

				// 回车提交
				if (e.which == 13)
				{
					$('.aw-edit-topic-box .aw-dropdown').hide();
					$('.aw-edit-topic-box .add').click();
					return false;
				}

				var lis = $(selector).parent().find('.aw-dropdown-list li');

				//键盘往下
				if (e.which == 40 && lis.is(':visible'))
				{
					var _index;
					if (!lis.hasClass('active'))
					{
						lis.eq(0).addClass('active');
					}
					else
					{
						$.each(lis, function (i, e)
						{
							if ($(this).hasClass('active'))
							{
								$(this).removeClass('active');
								if ($(this).index() == lis.length - 1)
								{
									_index = 0;
								}
								else
								{
									_index = $(this).index() + 1;
								}
							}
						});
						lis.eq(_index).addClass('active');
						$(selector).val(lis.eq(_index).text());
					}
				}

				//键盘往上
				if (e.which == 38 && lis.is(':visible'))
				{
					var _index;
					if (!lis.hasClass('active'))
					{
						lis.eq(lis.length - 1).addClass('active');
					}
					else
					{
						$.each(lis, function (i, e)
						{
							if ($(this).hasClass('active'))
							{
								$(this).removeClass('active');
								if ($(this).index() == 0)
								{
									_index = lis.length - 1;
								}
								else
								{
									_index = $(this).index() - 1;
								}
							}
						});
						lis.eq(_index).addClass('active');
						$(selector).val(lis.eq(_index).text());
					}

				}
			}
		});

		$(selector).blur(function()
		{
			$(selector).parent().find('.aw-dropdown').delay(500).fadeOut(300);
		});
	},

	// 插入下拉菜单
	set_dropdown_list: function(selector, data, selected)
	{
		$(selector).append(Hogan.compile(AW_TEMPLATE.dropdownList).render(
		{
			'items': data
		}));

		$(selector + ' .aw-dropdown-list li a').click(function ()
		{
			$('#aw-topic-tags-select').html($(this).text());
		});

		if (selected)
		{
			$(selector + " .dropdown-menu li a[data-value='" + selected + "']").click();
		}
	},

	/* 下拉菜单数据获取 */
	/*
	*    type : search, publish, invite, inbox, topic
	*/
	get_dropdown_list: function(selector, type, data)
	{
		if (AWS.G.dropdown_list_xhr != '')
		{
			AWS.G.dropdown_list_xhr.abort(); // 中止上一次ajax请求
		}
		var url;
		switch (type)
		{
			case 'search' :
				url = G_BASE_URL + '/search/ajax/search/?q=' + encodeURIComponent(data) + '&limit=5';
			break;

			case 'publish' :
				url = G_BASE_URL + '/search/ajax/search/?type=questions&q=' + encodeURIComponent(data) + '&limit=5';
			break;

			case 'invite' :
			case 'inbox' :
				url = G_BASE_URL + '/search/ajax/search/?type=users&q=' + encodeURIComponent(data) + '&limit=10';
			break;

			case 'topic' :
				url = G_BASE_URL + '/search/ajax/search/?type=topics&q=' + encodeURIComponent(data) + '&limit=10';
			break;

			case 'questions' :
				url = G_BASE_URL + '/search/ajax/search/?type=questions&q=' + encodeURIComponent(data) + '&limit=10';
			break;

			case 'articles' :
				url = G_BASE_URL + '/search/ajax/search/?type=articles&q=' + encodeURIComponent(data) + '&limit=10';
			break;

		}

		AWS.G.dropdown_list_xhr = $.get(url, function (result)
		{
			if (result.length != 0 && AWS.G.dropdown_list_xhr != undefined)
			{
				$(selector).parent().find('.aw-dropdown-list').html(''); // 清空内容
				switch (type)
				{
					case 'search' :
						$.each(result, function (i, a)
						{
							switch (a.type)
							{
								case 'questions':
									if (a.detail.best_answer > 0)
									{
										var active = 'active';
									}
									else
									{
										var active = ''
									}

									$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.searchDropdownListQuestions).render(
									{
										'url': a.url,
										'active': active,
										'content': a.name,
										'discuss_count': a.detail.answer_count
									}));
								break;

								case 'articles':
									$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.searchDropdownListArticles).render(
									{
										'url': a.url,
										'content': a.name,
										'comments': a.detail.comments
									}));
								break;

								case 'topics':
									$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.searchDropdownListTopics).render(
									{
										'url': a.url,
										'name': a.name,
										'discuss_count': a.detail.discuss_count,
										'topic_id': a.detail.topic_id
									}));
								break;

								case 'users':
									if (a.detail.signature == '')
									{
										var signature = _t('暂无介绍');
									}
									else
									{
										var signature = a.detail.signature;
									}

									$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.searchDropdownListUsers).render(
									{
										'url': a.url,
										'img': a.detail.avatar_file,
										'name': a.name,
										'intro': signature
									}));
								break;
							}
						});
					break;

					case 'publish' :
						$.each(result, function (i, a)
						{
							$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.questionDropdownList).render(
							{
								'url': a.url,
								'name': a.name
							}));
						});
						break;

					case 'topic' :
						$.each(result, function (i, a)
						{
							$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.editTopicDorpdownList).render(
							{
								'name': a['name']
							}));
						});
						break;

					case 'questions' :
					case 'articles' :
						$.each(result, function (i, a)
						{
							$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.questionDropdownList).render(
							{
								'url': '#',
								'name': a['name']
							}));
						});
						break;

						$(selector).parent().find('.aw-dropdown-list li').click(function()
						{
							$('.aw-question-list').append('<li data-id="'+$(this).attr('data-id')+'"><div class="col-sm-9">' + $(this).html() + '</div> <div class="col-sm-3"><a class="btn btn-danger btn-xs">删除</a></div></li>');

							$('.aw-question-list li').find("a").attr('href',function(){
								return $(this).attr("_href")

							});

							if ($('.question_ids').val() == '')
							{
								$('.question_ids').val($(this).attr('data-id') + ',');
							}
							else
							{
								$('.question_ids').val($('.question_ids').val() + $(this).attr('data-id') + ',');
							}
							$(".alert-box").modal('hide');
						});

						break;

					case 'inbox' :
					case 'invite' :
						$.each(result, function (i, a)
						{
							$(selector).parent().find('.aw-dropdown-list').append(Hogan.compile(AW_TEMPLATE.inviteDropdownList).render(
							{
								'uid': a.uid,
								'name': a.name,
								'img': a.detail.avatar_file
							}));
						});
						break;

				}
				if (type == 'publish')
				{
					$(selector).parent().find('.aw-publish-suggest-question, .aw-publish-suggest-question .aw-dropdown-list').show();
				}
				else
				{
					$(selector).parent().find('.aw-dropdown, .aw-dropdown-list').show().children().show();
					$(selector).parent().find('.title').hide();
					// 关键词高亮
					$(selector).parent().find('.aw-dropdown-list li.question a').highText(data, 'b', 'active');
				}
			}else
			{
				$(selector).parent().find('.aw-dropdown').show().end().find('.title').html(_t('没有找到相关结果')).show();
				$(selector).parent().find('.aw-dropdown-list, .aw-publish-suggest-question').hide();
			}
		}, 'json');

	}
}

AWS.Message =
{
	// 检测通知
	check_notifications: function()
	{
		// 检测登录状态
		if (G_USER_ID == 0)
		{
			clearInterval(AWS.G.notification_timer);
			return false;
		}

		$.get(G_BASE_URL + '/home/ajax/notifications/', function (result)
		{
			$('#inbox_unread').html(Number(result.rsm.inbox_num));

			var last_unread_notification = G_UNREAD_NOTIFICATION;

			G_UNREAD_NOTIFICATION = Number(result.rsm.notifications_num);

			if (G_UNREAD_NOTIFICATION > 0)
			{
				if (G_UNREAD_NOTIFICATION != last_unread_notification)
				{
					// 加载消息列表
					AWS.Message.load_notification_list();

					// 给导航label添加未读消息数量
					$('#notifications_unread').html(G_UNREAD_NOTIFICATION);
				}

				document.title = '(' + (Number(result.rsm.notifications_num) + Number(result.rsm.inbox_num)) + ') ' + document_title;

				$('#notifications_unread').show();
			}
			else
			{
				if ($('#header_notification_list').length)
				{
					$("#header_notification_list").html('<p class="aw-padding10" align="center">' + _t('没有未读通知') + '</p>');
				}

				if ($("#index_notification").length)
				{
					$("#index_notification").fadeOut();
				}

				document.title = document_title;

				$('#notifications_unread').hide();
			}

			// 私信
			if (Number(result.rsm.inbox_num) > 0)
			{
				$('#inbox_unread').show();
			}
			else
			{
				$('#inbox_unread').hide();
			}

		}, 'json');
	},

	// 阅读通知
	read_notification: function(selector, notification_id , reload)
	{
		if (notification_id)
		{
			selector.remove();

			var url = G_BASE_URL + '/notifications/ajax/read_notification/notification_id-' + notification_id;
		}
		else
		{
			if ($("#index_notification").length)
			{
				$("#index_notification").fadeOut();
			}

			var url = G_BASE_URL + '/notifications/ajax/read_notification/';
		}

		$.get(url, function (result)
		{
			AWS.Message.check_notifications();

			if (reload)
			{
				window.location.reload();
			}
		});
	},

	// 重新加载通知列表
	load_notification_list: function()
	{
		if ($("#index_notification").length)
		{
			// 给首页通知box内label添加未读消息数量
			$("#index_notification").fadeIn().find('[name=notification_unread_num]').html(G_UNREAD_NOTIFICATION);

			$('#index_notification ul#notification_list').html('<p align="center" style="padding: 15px 0"><img src="' + G_STATIC_URL + '/common/loading_b.gif"/></p>');

			$.get(G_BASE_URL + '/notifications/ajax/list/flag-0__page-0', function (result)
			{
				$('#index_notification ul#notification_list').html(result);

				AWS.Message.notification_show(5);
			});
		}

		if ($("#header_notification_list").length)
		{
			$.get(G_BASE_URL + '/notifications/ajax/list/flag-0__limit-5__template-header_list', function (result)
			{
				if (result.length)
				{
					$("#header_notification_list").html(result);
				}
				else
				{
					$("#header_notification_list").html('<p class="aw-padding10" align="center">' + _t('没有未读通知') + '</p>');
				}
			});
		}
	},

	// 控制通知数量
	notification_show: function(length)
	{
		if ($('#index_notification').length > 0)
		{
			if ($('#index_notification ul#notification_list li').length == 0)
			{
				$('#index_notification').fadeOut();
			}
			else
			{
				$('#index_notification ul#notification_list li').each(function (i, e)
				{
					if (i < length)
					{
						$(e).show();
					}
					else
					{
						$(e).hide();
					}
				});
			}
		}
	}
}

AWS.Init =
{
	// 初始化问题讨论框
	init_comment_box: function(selector)
	{
		$(document).on('click', selector, function ()
		{
			$(this).parents('.aw-question-detail').find('.aw-invite-box, .aw-question-related-box').hide();

			if (!$(this).attr('data-type') || !$(this).attr('data-id'))
			{
				return true;
			}

			var comment_box_id = '#aw-comment-box-' + $(this).attr('data-type') + '-' + 　$(this).attr('data-id');

			if ($(comment_box_id).length)
			{
				if ($(comment_box_id).css('display') == 'none')
				{
					$(this).addClass('active');

					$(comment_box_id).fadeIn();
				}
				else
				{
					$(this).removeClass('active');
					$(comment_box_id).fadeOut();
				}
			}
			else
			{
				// 动态插入commentBox
				switch ($(this).attr('data-type'))
				{
					case 'question':
						var comment_form_action = G_BASE_URL + '/question/ajax/save_question_discussion/question_id-' + $(this).attr('data-id');
						var comment_data_url = G_BASE_URL + '/question/ajax/get_question_discussions/question_id-' + $(this).attr('data-id');
						break;

					case 'answer':
						var comment_form_action = G_BASE_URL + '/question/ajax/save_answer_discussion/answer_id-' + $(this).attr('data-id');
						var comment_data_url = G_BASE_URL + '/question/ajax/get_answer_discussions/answer_id-' + $(this).attr('data-id');
						break;
				}

				if (G_USER_ID)
				{
					$(this).parents('.aw-item').find('.mod-footer').append(Hogan.compile(AW_TEMPLATE.commentBox).render(
					{
						'comment_form_id': comment_box_id.replace('#', ''),
						'comment_form_action': comment_form_action
					}));
/*
					$(comment_box_id).find('.aw-comment-txt').bind(
					{
						focus: function ()
						{
							$(comment_box_id).find('.aw-comment-box-btn').show();
						},

						blur: function ()
						{
							if ($(this).val() == '')
							{
								$(comment_box_id).find('.aw-comment-box-btn').hide();
							}
						}
					});
*/
				}
				else
				{
					$(this).parents('.aw-item').find('.mod-footer').append(Hogan.compile(AW_TEMPLATE.commentBoxClose).render(
					{
						'comment_form_id': comment_box_id.replace('#', ''),
						'comment_form_action': comment_form_action
					}));
				}

				// 判断是否有讨论数据
				$.get(comment_data_url, function (result)
				{
					if ($.trim(result) == '')
					{
						result = '<div align="center" class="aw-padding10">' + _t('暂无讨论') + '</div>';
					}

					$(comment_box_id).find('.aw-comment-list').html(result);
				});

				// textarae自动增高
				$(comment_box_id).find('.aw-comment-txt').autosize();

				$(this).addClass('active');
			}
		});
	},

	// 初始化话题编辑box
	init_topic_edit_box: function(selector) //selector -> .aw-edit-topic
	{
		$(selector).click(function ()
		{
			var _topic_editor = $(this).parents('.aw-topic-bar'),
				data_id = _topic_editor.attr('data-id'),
				data_type = _topic_editor.attr('data-type');

			if (!_topic_editor.hasClass('active'))
			{
				_topic_editor.addClass('active');

				if (!_topic_editor.find('.topic-tag .close').length)
				{
					_topic_editor.find('.topic-tag').append('<a class="close"><i class="icon icon-delete"></i></a>');
				}
			}
			else
			{
				_topic_editor.addClass('active');
			}

			// 判断插入编辑box
			if (_topic_editor.find('.aw-edit-topic-box').length == 0)
			{
				_topic_editor.append(AW_TEMPLATE.editTopicBox);

				// 给编辑box添加按钮添加事件
				_topic_editor.find('.add').click(function ()
				{
					if (_topic_editor.find('#aw_edit_topic_title').val() != '')
					{
						switch (data_type)
						{
							case 'publish':
								_topic_editor.find('.tag-bar').prepend('<span class="topic-tag"><a class="text">' + _topic_editor.find('#aw_edit_topic_title').val() + '</a><a class="close" onclick="$(this).parents(\'.topic-tag\').remove();"><i class="icon icon-delete"></i></a><input type="hidden" value="' + _topic_editor.find('#aw_edit_topic_title').val() + '" name="topics[]" /></span>').hide().fadeIn();

								_topic_editor.find('#aw_edit_topic_title').val('');
							break;

							case 'question':
								$.post(G_BASE_URL + '/topic/ajax/save_topic_relation/', 'type=question&item_id=' + data_id + '&topic_title=' + encodeURIComponent(_topic_editor.find('#aw_edit_topic_title').val()), function (result)
								{
									if (result.errno != 1)
									{
										AWS.alert(result.err);

										return false;
									}

									_topic_editor.find('.tag-bar').prepend('<span class="topic-tag" data-id="' + result.rsm.topic_id + '"><a href="' + G_BASE_URL + '/topic/' + result.rsm.topic_id + '" class="text">' + _topic_editor.find('#aw_edit_topic_title').val() + '</a><a class="close"><i class="icon icon-delete"></i></a></span>').hide().fadeIn();

									_topic_editor.find('#aw_edit_topic_title').val('');
								}, 'json');
							break;

							case 'article':
								$.post(G_BASE_URL + '/topic/ajax/save_topic_relation/', 'type=article&item_id=' + data_id + '&topic_title=' + encodeURIComponent(_topic_editor.find('#aw_edit_topic_title').val()), function (result)
								{
									if (result.errno != 1)
									{
										AWS.alert(result.err);

										return false;
									}

									_topic_editor.find('.tag-bar').prepend('<span class="topic-tag" data-id="' + result.rsm.topic_id + '"><a href="' + G_BASE_URL + '/topic/' + result.rsm.topic_id + '" class="text">' + _topic_editor.find('#aw_edit_topic_title').val() + '</a><a class="close"><i class="icon icon-delete"></i></a></span>').hide().fadeIn();

									_topic_editor.find('#aw_edit_topic_title').val('');
								}, 'json');
							break;

							case 'video':
								$.post(G_BASE_URL + '/topic/ajax/save_topic_relation/', 'type=video&item_id=' + data_id + '&topic_title=' + encodeURIComponent(_topic_editor.find('#aw_edit_topic_title').val()), function (result)
								{
									if (result.errno != 1)
									{
										AWS.alert(result.err);

										return false;
									}

									_topic_editor.find('.tag-bar').prepend('<span class="topic-tag" data-id="' + result.rsm.topic_id + '"><a href="' + G_BASE_URL + '/topic/' + result.rsm.topic_id + '" class="text">' + _topic_editor.find('#aw_edit_topic_title').val() + '</a><a class="close"><i class="icon icon-delete"></i></a></span>').hide().fadeIn();

									_topic_editor.find('#aw_edit_topic_title').val('');
								}, 'json');
							break;


							case 'topic':
								$.post(G_BASE_URL + '/topic/ajax/save_related_topic/topic_id-' + data_id, 'topic_title=' + encodeURIComponent(_topic_editor.find('#aw_edit_topic_title').val()), function (result)
								{
									if (result.errno != 1)
									{
										AWS.alert(result.err);

										return false;
									}

									_topic_editor.find('.tag-bar').prepend('<span class="topic-tag"><a href="' + G_BASE_URL + '/favorite/tag-' + encodeURIComponent(_topic_editor.find('#aw_edit_topic_title').val()) + '" class="text">' + _topic_editor.find('#aw_edit_topic_title').val() + '</a><a class="close"><i class="icon icon-delete"></i></a></span>').hide().fadeIn();

									_topic_editor.find('#aw_edit_topic_title').val('');
								}, 'json');
							break;

						}
					}
				});

				// 给编辑box取消按钮添加事件
				_topic_editor.find('.close-edit').click(function ()
				{
					_topic_editor.removeClass('active');
					_topic_editor.find('.aw-edit-topic-box').hide();
					_topic_editor.find('.aw-edit-topic').show();
				});

				AWS.Dropdown.bind_dropdown_list($(this).parents('.aw-topic-bar').find('#aw_edit_topic_title'),'topic');
			}

			$(this).parents('.aw-topic-bar').find('.aw-edit-topic-box').fadeIn();

			// 是否允许创建新话题
			if (!G_CAN_CREATE_TOPIC)
			{
				$(this).parents('.aw-topic-bar').find('.add').hide();
			}

			$(this).hide();
		});
	}
}

function _t(string, replace)
{
	if (typeof (aws_lang) != 'undefined')
	{
		if (typeof (aws_lang[string]) != 'undefined')
		{
			string = aws_lang[string];
		}
	}

	if (replace)
	{
		string = string.replace('%s', replace);
	}

	return string;
};

// jQuery扩展
(function ($)
{
	$.fn.extend(
	{
		insertAtCaret: function (textFeildValue)
		{
			var textObj = $(this).get(0);
			if (document.all && textObj.createTextRange && textObj.caretPos)
			{
				var caretPos = textObj.caretPos;
				caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == '' ?
					textFeildValue + '' : textFeildValue;
			}
			else if (textObj.setSelectionRange)
			{
				var rangeStart = textObj.selectionStart,
					rangeEnd = textObj.selectionEnd,
					tempStr1 = textObj.value.substring(0, rangeStart),
					tempStr2 = textObj.value.substring(rangeEnd);
				textObj.value = tempStr1 + textFeildValue + tempStr2;
				textObj.focus();
				var len = textFeildValue.length;
				textObj.setSelectionRange(rangeStart + len, rangeStart + len);
				textObj.blur();
			}
			else
			{
				textObj.value += textFeildValue;
			}
		},

		highText: function (searchWords, htmlTag, tagClass)
		{
			return this.each(function ()
			{
				$(this).html(function high(replaced, search, htmlTag, tagClass)
				{
					var pattarn = search.replace(/\b(\w+)\b/g, "($1)").replace(/\s+/g, "|");

					return replaced.replace(new RegExp(pattarn, "ig"), function (keyword)
					{
						return $("<" + htmlTag + " class=" + tagClass + ">" + keyword + "</" + htmlTag + ">").outerHTML();
					});
				}($(this).text(), searchWords, htmlTag, tagClass));
			});
		},

		outerHTML: function (s)
		{
			return (s) ? this.before(s).remove() : jQuery("<p>").append(this.eq(0).clone()).html();
		}
	});

	$.extend(
	{
		// 滚动到指定位置
		scrollTo : function (type, duration, options)
		{
			if (typeof type == 'object')
			{
				var type = $(type).offset().top
			}

			$('html, body').animate({
				scrollTop: type
			}, {
				duration: duration,
				queue: options.queue
			});
		}
	})

})(jQuery);
