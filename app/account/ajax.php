<?php
/*
+--------------------------------------------------------------------------
|   WeCenter [#RELEASE_VERSION#]
|   ========================================
|   by WeCenter Software
|   © 2011 - 2014 WeCenter. All Rights Reserved
|   http://www.wecenter.com
|   ========================================
|   Support: WeCenter@qq.com
|
+---------------------------------------------------------------------------
*/

define('IN_AJAX', TRUE);


if (!defined('IN_ANWSION'))
{
	die;
}

class ajax extends AWS_CONTROLLER
{
	public function get_access_rule()
	{
		$rule_action['rule_type'] = 'white';

		$rule_action['actions'] = array(
			'check_username',
			'register_process',
			'login_process',
			'request_find_password',
			'find_password_modify'
		);

		return $rule_action;
	}

	public function setup()
	{
		HTTP::no_cache_header();
	}

	public function check_username_action()
	{
		if ($this->model('register')->check_username_char($_POST['username']) OR
			$this->model('register')->check_username_sensitive_words($_POST['username']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('用户名不符合规则')));
		}

		if ($this->model('account')->username_exists($_POST['username']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('用户名已被注册')));
		}

		H::ajax_json_output(AWS_APP::RSM(null, 1, null));
	}

	public function register_process_action()
	{
		if ($this->user_id)
		{
			H::ajax_json_output(AWS_APP::RSM(array(
				'url' => get_js_url('/')
			), 1, null));
		}

		if (! $_POST['agreement_chk'])
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('你必需同意 %s 才能继续', get_setting('user_agreement_name'))));
		}

		if (get_setting('register_type') == 'close')
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('本站目前关闭注册')));
		}
		else if (get_setting('register_type') == 'invite' AND !$_POST['icode'])
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('本站只能通过邀请注册')));
		}

		if (trim($_POST['user_name']) == '')
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('请输入用户名')));
		}

		if (strlen($_POST['password']) < 6)
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('密码长度不符合规则')));
		}

		if ($_POST['password'] != $_POST['re_password'])
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1,  AWS_APP::lang()->_t('两次输入的密码不一致')));
		}

		// 检查验证码
		if (get_setting('register_seccode') == 'Y' AND !AWS_APP::captcha()->is_validate($_POST['seccode_verify']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('请填写正确的验证码')));
		}

		$register_interval = rand_minmax(get_setting('register_interval_min'), get_setting('register_interval_max'), get_setting('register_interval'));
		if (!check_user_operation_interval('register', 0, $register_interval, false))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('本站已开启注册频率限制, 请稍后再试')));
		}

		if ($check_result = $this->model('register')->check_username_char($_POST['user_name']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, $check_result));
		}

		if ( trim($_POST['user_name']) != $_POST['user_name'] OR
			$this->model('register')->check_username_sensitive_words($_POST['user_name']) )
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('用户名中包含敏感词或系统保留字')));
		}

		if ($this->model('account')->username_exists($_POST['user_name']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('用户名已经存在')));
		}

		$uid = $this->model('account')->user_register($_POST['user_name'], $_POST['password']);

		if (!$uid)
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('注册失败')));
		}

		set_user_operation_last_time('register', 0);

		if (isset($_POST['sex']))
		{
			$update_data['sex'] = intval($_POST['sex']);

			$update_data['signature'] = htmlspecialchars($_POST['signature']);

			// 更新主表
			$this->model('account')->update_user_fields($update_data, $uid);
		}

		$this->model('account')->setcookie_logout();
		$this->model('account')->setsession_logout();

		$user_info = $this->model('account')->get_user_info_by_uid($uid);

		$this->model('account')->setcookie_login($user_info['uid'], $user_info['user_name'], $_POST['password'], $user_info['salt']);

		H::ajax_json_output(AWS_APP::RSM(array(
			'url' => get_js_url('/home/first_login-TRUE')
		), 1, null));

	}

	public function login_process_action()
	{
		if ($this->user_id)
		{
			H::ajax_json_output(AWS_APP::RSM(array(
				'url' => get_js_url('/')
			), 1, null));
		}

		if (!$_POST['user_name'] OR !$_POST['password'])
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('请输入正确的帐号或密码')));
		}

		// 检查验证码
		if ($this->model('login')->is_captcha_required())
		{
			if ($_POST['captcha_enabled'] == '0')
			{
				//H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('请刷新页面重试')));
				H::ajax_json_output(AWS_APP::RSM(null, 1, null));
			}
			if (!AWS_APP::captcha()->is_validate($_POST['seccode_verify']))
			{
				H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('请填写正确的验证码')));
			}
		}


		$user_info = $this->model('login')->check_login($_POST['user_name'], $_POST['password']);

		if (is_null($user_info))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('该账号已经连续多次尝试登录失败, 为了安全起见, 该账号 %s 分钟内禁止登录', get_setting('limit_login_attempts_interval'))));
		}
		elseif (!$user_info)
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('请输入正确的帐号或密码')));
		}
		
		{
			if ($user_info['forbidden'])
			{
				//H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('抱歉, 你的账号已经被禁止登录')));
				H::ajax_json_output(AWS_APP::RSM(array(
					'url' => get_js_url('/people/') . $user_info['url_token']
				), 1, null));
			}

			if ($user_info['flagged'] > 0)
			{
				H::ajax_json_output(AWS_APP::RSM(array(
					//'url' => get_js_url('/')
					'url' => get_js_url('/people/') . $user_info['url_token']
				), 1, null));
			}

			// 记住我
			if ($_POST['net_auto_login'])
			{
				$expire = 60 * 60 * 24 * 360;
			}

			//$this->model('account')->update_user_last_login($user_info['uid']);
			$this->model('account')->setcookie_logout();

			$this->model('account')->setcookie_login($user_info['uid'], $_POST['user_name'], $_POST['password'], $user_info['salt'], $expire);

			if ($_POST['return_url'])
			{
				//$url = get_js_url($_POST['return_url']);
				// TODO: 检查 $_POST['return_url']
				$url = get_js_url('/');
			}
			else
			{
				$url = get_js_url('/');
			}

			H::ajax_json_output(AWS_APP::RSM(array(
				'url' => $url
			), 1, null));
		}
	}


	public function request_find_password_action()
	{
		if (!$user_name = trim($_POST['user_name']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1',  AWS_APP::lang()->_t('请填写用户名')));
		}

		if (!AWS_APP::captcha()->is_validate($_POST['seccode_verify']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1',  AWS_APP::lang()->_t('请填写正确的验证码')));
		}

		if (!$user_info = $this->model('account')->get_user_info_by_username($user_name))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1',  AWS_APP::lang()->_t('用户名不存在')));
		}

		H::ajax_json_output(AWS_APP::RSM(array(
			'url' => get_js_url('/account/find_password/modify/uid-') . $user_info['uid']
		), 1, null));
	}

	public function find_password_modify_action()
	{
		if (!$recovery_code = trim($_POST['recovery_code']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1',  AWS_APP::lang()->_t('请填写恢复码')));
		}

		if (!$_POST['password'])
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1,  AWS_APP::lang()->_t('请输入密码')));
		}

		if (strlen($_POST['password']) < 6)
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('密码长度不符合规则')));
		}

		if ($_POST['password'] != $_POST['re_password'])
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1,  AWS_APP::lang()->_t('两次输入的密码不一致')));
		}

		if (!AWS_APP::captcha()->is_validate($_POST['seccode_verify']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1,  AWS_APP::lang()->_t('请填写正确的验证码')));
		}

		$user_info = $this->model('account')->get_user_info_by_uid(intval($_POST['uid']));

		if (!$this->model('account')->verify_user_recovery_code($user_info['uid'], $recovery_code))
		{
			H::ajax_json_output(AWS_APP::RSM(null, -1,  AWS_APP::lang()->_t('恢复码无效')));
		}

		$this->model('account')->update_user_password_ingore_oldpassword($_POST['password'], $user_info['uid']);

		H::ajax_json_output(AWS_APP::RSM(array(
			'url' => get_js_url('/account/find_password/process_success/')
		), 1, null));
	}

	public function avatar_upload_action()
	{
		if (get_setting('upload_enable') == 'N')
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('本站未开启上传功能')));
		}

		if (!check_user_operation_interval('profile', $this->user_id, $this->user_info['permission']['interval_modify']))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('操作过于频繁, 请稍后再试')));
		}

		if (!$this->model('avatar')->upload_avatar('aws_upload_file', $this->user_id, $error))
		{
			H::ajax_json_output(AWS_APP::RSM(null, '-1', $error));
		}

		set_user_operation_last_time('profile', $this->user_id);

		H::ajax_json_output(AWS_APP::RSM(array(
			'thumb' => get_setting('upload_url') . '/avatar/' . $this->model('avatar')->get_avatar_path($this->user_id, 'max') . '?' . rand(1, 999)
		), 1, null));
	}


	public function privacy_setting_action()
	{
		if ($notify_actions = $this->model('notify')->notify_action_details)
		{
			$notification_setting = array();

			foreach ($notify_actions as $key => $val)
			{
				if (! isset($_POST['notification_settings'][$key]) AND $val['user_setting'])
				{
					$notification_setting[] = intval($key);
				}
			}
		}

		$this->model('account')->update_user_fields(array(
			'inbox_recv' => intval($_POST['inbox_recv'])
		), $this->user_id);

		$this->model('account')->update_notification_setting_fields($notification_setting, $this->user_id);

		H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('隐私设置保存成功')));
	}

	public function profile_setting_action()
	{
		if ($_POST['user_name'])
		{
			$user_name = trim($_POST['user_name']);
			if ($user_name AND $user_name != $this->user_info['user_name'])
			{
				if (!$this->model('currency')->check_balance_for_operation($this->user_info['currency'], 'currency_system_config_change_username'))
				{
					H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('你的剩余%s已经不足以进行此操作', get_setting('currency_name'))));
				}
				if ($check_result = $this->model('register')->check_username_char($user_name))
				{
					H::ajax_json_output(AWS_APP::RSM(null, '-1', $check_result));
				}
				if ($this->model('register')->check_username_sensitive_words($user_name))
				{
					H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('用户名不符合规则')));
				}
				if ($this->model('account')->username_exists($user_name))
				{
					H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('已经存在相同的姓名, 请重新填写')));
				}
				$this->model('account')->update_user_name($user_name, $this->user_id);

				$this->model('currency')->process($this->user_id, 'CHANGE_USERNAME', get_setting('currency_system_config_change_username'), '修改用户名');
			}
		}

		$update_data['sex'] = intval($_POST['sex']);

		$update_data['signature'] = htmlspecialchars($_POST['signature']);

		// 更新主表
		$this->model('account')->update_user_fields($update_data, $this->user_id);

		$this->model('account')->set_default_timezone($_POST['default_timezone'], $this->user_id);

		H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('个人资料保存成功')));
	}

	public function modify_password_action()
	{
    //有提交密码的情况
    if($_POST['old_password'] && $_POST['password'] && $_POST['re_password'])
    {
      if (!$_POST['old_password'])
      {
        H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('请输入当前密码')));
      }

      if ($_POST['password'] != $_POST['re_password'])
      {
        H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('请输入相同的确认密码')));
      }

      if (strlen($_POST['password']) < 6)
      {
        H::ajax_json_output(AWS_APP::RSM(null, -1, AWS_APP::lang()->_t('密码长度不符合规则')));
      }

      if ($this->model('account')->update_user_password($_POST['password'], $this->user_id, $_POST['old_password'], $this->user_info['salt']))
      {
        //修改密码后不踢掉用户的登录状态
        $this->model('account')->setcookie_login($this->user_id, $this->user_info['user_name'], $_POST['password'], $this->user_info['salt']);
        H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('密码修改成功')));
      }
      else
      {
        H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('请输入正确的当前密码')));
      }
    }
    //有提交密码恢复字符串的情况
    elseif($_POST['password_recovery_str'])
    //
    {
      if($this->user_info['password_recovery_str']) H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('已经设置过恢复码。如需重新设置，请修改密码')));
    
      $update_data['password_recovery_str'] = sha1($this->user_id . base64_encode(trim($_POST['password_recovery_str'])) . $this->user_id);

      // 更新主表
      $this->model('account')->update_user_fields($update_data, $this->user_id);
    
    
      H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('密码恢复设置成功')));
    }
    //什么都没有
    else
    {
      H::ajax_json_output(AWS_APP::RSM(null, '-1', AWS_APP::lang()->_t('什么都没做啊┑(~Д~)┍')));
    }
	}

}
