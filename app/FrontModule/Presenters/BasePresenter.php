<?php declare(strict_types = 1);

namespace App\FrontModule\Presenters;

use App\Posts\Posts;
use App\Settings\Settings;
use Latte;
use Nette;
use Nette\Application\UI;
use WebLoader;

abstract class BasePresenter extends Nette\Application\UI\Presenter
{

	/** @var Posts @inject */
	public $posts;

	/** @var \Nette\Http\Session @inject */
	public $session;

	/** @var Settings @inject */
	public $settings;

	/** @var \WebLoader\Nette\LoaderFactory @inject */
	public $webLoader;

	protected $setting;

	public function startup()
	{
		parent::startup();
		$this->template->setting = $this->setting = $this->settings->findAllByKeys();
		$this->template->wfont = $this->getHttpRequest()->getCookie('wfont');
	}

	protected function createComponentSearch()
	{
		$form = new UI\Form;
		$form->addText('search')
			->setRequired('Vyplňte co chcete vyhledávat.')
			->setValue($this->getParameter('search'));
		$form->addSubmit('send', 'Go!');
		$form->onSuccess[] = [$this, 'searchSucceeded'];
		return $form;
	}

	public function searchSucceeded(UI\Form $form, $values)
	{
		$this->redirect(':Front:Search:default', $values->search);
	}

	protected function createComponentSignOutForm()
	{
		$form = new UI\Form;
		$form->addProtection();
		$form->addSubmit('logout', 'Odhlásit se')
			->setAttribute('class', 'logout');
		$form->onSuccess[] = function () {
			$this->getUser()->logout();
			$this->flashMessage('Odhlášení bylo úpěšné.', 'info');
			$this->redirect(':Auth:Sign:in');
		};
		return $form;
	}

	/**
	 * @return UI\ITemplate
	 */
	protected function createTemplate()
	{
		/** @var Nette\Bridges\ApplicationLatte\Template $template */
		$template = parent::createTemplate();
		$latte = $template->getLatte();
		$latte->addFilter('texy', function ($input) {
			$texy = $this->prepareTexy();
			$html = new Nette\Utils\Html();
			return $html::el()->setHtml($texy->process($input));
		});
		$latte->addFilter('vlna', function ($string) {
			$string = preg_replace('<([^a-zA-Z0-9])([ksvzaiou])\s([a-zA-Z0-9]{1,})>i', "$1$2\xc2\xa0$3", $string); //&nbsp; === \xc2\xa0
			return $string;
		});
		$latte->addFilter('dateInWords', function ($time) {
			$time = Nette\Utils\DateTime::from($time);
			$months = [1 => 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
			return $time->format('j. ') . $months[$time->format('n')] . $time->format(' Y');
		});
		$latte->addFilter('timeAgoInWords', function ($time) {
			$time = Nette\Utils\DateTime::from($time);
			$delta = round((time() - $time->getTimestamp()) / 60);
			if ($delta == 0) {
				return 'před okamžikem';
			}
			if ($delta == 1) {
				return 'před minutou';
			}
			if ($delta < 45) {
				return "před $delta minutami";
			}
			if ($delta < 90) {
				return 'před hodinou';
			}
			if ($delta < 1440) {
				return 'před ' . round($delta / 60) . ' hodinami';
			}
			if ($delta < 2880) {
				return 'včera';
			}
			if ($delta < 43200) {
				return 'před ' . round($delta / 1440) . ' dny';
			}
			if ($delta < 86400) {
				return 'před měsícem';
			}
			if ($delta < 525960) {
				return 'před ' . round($delta / 43200) . ' měsíci';
			}
			if ($delta < 1051920) {
				return 'před rokem';
			}
			return 'před ' . round($delta / 525960) . ' lety';
		});
		return $template;
	}

	protected function createComponentCss()
	{
		return $this->webLoader->createCssLoader('default')->setMedia('screen,projection,tv,print');
	}

	protected function createComponentJs()
	{
		return $this->webLoader->createJavaScriptLoader('default');
	}

	/**
	 * @return \App\Texy\FshlTexy
	 */
	protected function prepareTexy()
	{
		$texy = new \App\Texy\FshlTexy();
		$texy->addHandler('block', [$texy, 'blockHandler']);
		$texy->tabWidth = 4;
		$texy->headingModule->top = 3; //start at H3
		$texy->headingModule->generateID = TRUE;
		$texy->imageModule->root = $this->getHttpRequest()->getUrl()->getBaseUrl() . 'uploads/';
		$texy->imageModule->leftClass = 'leftAlignedImage';
		$texy->imageModule->rightClass = 'rightAlignedImage';
		return $texy;
	}

	/**
	 * Formats layout template file names.
	 * @return array
	 */
	public function formatLayoutTemplateFiles()
	{
		return [__DIR__ . '/Templates/@layout.latte'];
	}

	/**
	 * Formats view template file names.
	 * @return array
	 */
	public function formatTemplateFiles()
	{
		list(, $presenter) = \Nette\Application\Helpers::splitName($this->getName());
		$dir = dirname($this->getReflection()->getFileName());
		$dir = is_dir("$dir/Templates") ? $dir : dirname($dir);
		return ["$dir/Templates/$presenter/$this->view.latte"];
	}

}