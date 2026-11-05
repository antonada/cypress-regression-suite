import 'cypress-mochawesome-reporter/register';
import { register as registerCypressGrep } from '@cypress/grep';
import './commands';

registerCypressGrep();
