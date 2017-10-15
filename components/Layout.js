// @flow

import React from 'react';
import Head from 'next/head';
import NProgress from 'nprogress';
import Router from 'next/router';
import PropTypes from 'prop-types';

import Wrapper from '../components/Wrapper';
import { initGA, logPageView } from '../services/Analytics';
import Colors from '../services/Colors';

Router.onRouteChangeStart = () => NProgress.start();
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

const defaultTitle = 'Martin Zlámal';

class Layout extends React.Component {
  componentDidMount() {
    if (!window.GA_INITIALIZED) {
      initGA();
      window.GA_INITIALIZED = true;
    }
    logPageView();
  }
  render() {
    return (
      <div>
        <Head>
          <title>
            {this.props.title !== undefined
              ? `${this.props.title} | ${defaultTitle}`
              : defaultTitle}
          </title>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
          <link rel="icon" href="/static/favicon.ico" />
          {/* Do not use styled-jsx here: https://github.com/zeit/next.js/issues/885 */}
          <style>
            {`
              body {
                font-family: Helvetica, Arial, Sans-Serif;
                font-weight: 300;
                font-size: 1.8rem;
                background-color: #f9f9f9;
                margin: 0;
                color: ${Colors.dark};
              }

              html {
                font-size: 62.5%;
              }

              a,
              a:hover,
              a:focus {
                color: ${Colors.red};
                text-decoration: none;
              }

              a:hover,
              a:focus {
                text-decoration: underline;
              }
            `}
          </style>
          <link rel="stylesheet" type="text/css" href="/static/nprogress.css" />
        </Head>

        <Wrapper>{this.props.children}</Wrapper>
      </div>
    );
  }
}

Layout.propTypes = {
  title: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
};

export default Layout;
