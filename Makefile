testjs: ## Clean and Make js tests
	cd js; yarn test

testpy: ## Clean and Make unit tests
	python3.7 -m pytest -v jupyterlab_autoversion/tests --cov=jupyterlab_autoversion

tests: lint ## run the tests
	python3.7 -m pytest -v jupyterlab_autoversion/tests --cov=jupyterlab_autoversion --junitxml=python_junit.xml --cov-report=xml --cov-branch
	cd js; yarn test

lint: ## run linter
	flake8 jupyterlab_autoversion setup.py
	cd js; yarn lint

fix:  ## run autopep8/tslint fix
	autopep8 --in-place -r -a -a jupyterlab_autoversion/
	cd js; yarn fix

annotate: ## MyPy type annotation check
	mypy -s jupyterlab_autoversion

annotate_l: ## MyPy type annotation check - count only
	mypy -s jupyterlab_autoversion | wc -l

clean: ## clean the repository
	find . -name "__pycache__" | xargs  rm -rf
	find . -name "*.pyc" | xargs rm -rf
	find . -name ".ipynb_checkpoints" | xargs  rm -rf
	rm -rf .coverage coverage coverage.xml cover htmlcov python_junit.xml logs build dist lab-dist *.egg-info
	cd js; rm -rf node_modules lib package-lock.json yarn.lock tsconfig.tsbuildinfo
	# make -C ./docs clean

docs:  ## make documentation
	make -C ./docs html
	open ./docs/_build/html/index.html

install:  ## install to site-packages
	pip3 install .

serverextension: install ## enable serverextension
	jupyter serverextension enable --py jupyterlab_autoversion

js:  ## build javascript
	cd js; yarn
	cd js; yarn build

labextension: js ## enable labextension
	cd js; jupyter labextension install .

dist: js  ## create dists
	rm -rf dist build
	python3.7 setup.py sdist bdist_wheel

publish: dist  ## dist to pypi and npm
	twine check dist/* && twine upload dist/*
	cd js; npm publish

init_debug:  ## make launch.json from template for debugging in vscode
	cp .vscode/jupyterlab_venv.env.template .vscode/jupyterlab_venv.env
	cp .vscode/launch.json.template .vscode/launch.json
# Thanks to Francoise at marmelab.com for this
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo '$*=$($*)'

.PHONY: clean install serverextension labextension test tests help docs dist
