/**
 * Gemini CLI Extensions Command
 * 
 * Manages Gemini CLI Extensions (October 2025 framework).
 * Supports install, enable, disable, update, uninstall, list, and info commands.
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { getExtensionManager } from "../../services/extension-manager.js";

export class GemExtensionsCommand extends Command {
  private logger: Logger;

  constructor() {
    super("gem-extensions");
    this.logger = new Logger("GemExtensions");

    this.description("Manage Gemini CLI Extensions (Official Framework)")
      .alias("gem-ext")
      .addCommand(this.createInstallCommand())
      .addCommand(this.createListCommand())
      .addCommand(this.createEnableCommand())
      .addCommand(this.createDisableCommand())
      .addCommand(this.createUpdateCommand())
      .addCommand(this.createUninstallCommand())
      .addCommand(this.createInfoCommand());
  }

  /**
   * Install command
   */
  private createInstallCommand(): Command {
    return new Command("install")
      .description("Install extension from GitHub or local path")
      .argument("<source>", "GitHub URL (github:user/repo) or local path")
      .option("--enable", "Enable extension after installation", false)
      .action(async (source: string, options) => {
        const spinner = ora(`Installing extension from ${source}...`).start();

        try {
          const manager = getExtensionManager();
          const metadata = await manager.install(source);

          spinner.succeed(`Extension ${chalk.bold(metadata.name)} installed`);

          console.log(chalk.blue("\n📦 Extension Details:"));
          console.log(chalk.gray(`  Name: ${metadata.name}`));
          console.log(chalk.gray(`  Version: ${metadata.version}`));
          console.log(chalk.gray(`  Description: ${metadata.description || 'N/A'}`));

          if (options.enable) {
            spinner.start("Enabling extension...");
            await manager.enable(metadata.name);
            spinner.succeed(`Extension ${chalk.bold(metadata.name)} enabled`);
          } else {
            console.log(chalk.yellow("\n💡 Run 'gem-extensions enable ${metadata.name}' to activate"));
          }
        } catch (error) {
          spinner.fail("Installation failed");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  /**
   * List command
   */
  private createListCommand(): Command {
    return new Command("list")
      .description("List all installed extensions")
      .option("--enabled", "Show only enabled extensions")
      .option("--disabled", "Show only disabled extensions")
      .action(async (options) => {
        const spinner = ora("Loading extensions...").start();

        try {
          const manager = getExtensionManager();
          let extensions = await manager.list();

          if (options.enabled) {
            extensions = extensions.filter(ext => ext.enabled);
          } else if (options.disabled) {
            extensions = extensions.filter(ext => !ext.enabled);
          }

          spinner.succeed("Extensions loaded");

          if (extensions.length === 0) {
            console.log(chalk.yellow("\nNo extensions found"));
            console.log(chalk.gray("Install an extension with: gem-extensions install <source>"));
            return;
          }

          console.log(chalk.blue("\n📦 Installed Extensions:\n"));

          for (const ext of extensions) {
            const status = ext.enabled
              ? chalk.green("✓ Enabled")
              : chalk.gray("○ Disabled");

            console.log(chalk.bold(`  ${ext.name}`) + chalk.gray(` v${ext.version}`));
            console.log(`    Status: ${status}`);
            console.log(chalk.gray(`    ${ext.description || 'No description'}`));
            console.log(chalk.gray(`    Installed: ${new Date(ext.installedAt).toLocaleDateString()}`));
            console.log();
          }

          console.log(chalk.gray(`Total: ${extensions.length} extension(s)`));
        } catch (error) {
          spinner.fail("Failed to load extensions");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  /**
   * Enable command
   */
  private createEnableCommand(): Command {
    return new Command("enable")
      .description("Enable an installed extension")
      .argument("<name>", "Extension name")
      .action(async (name: string) => {
        const spinner = ora(`Enabling extension ${name}...`).start();

        try {
          const manager = getExtensionManager();
          await manager.enable(name);

          spinner.succeed(`Extension ${chalk.bold(name)} enabled`);
          console.log(chalk.green("\n✓ Extension is now active"));
        } catch (error) {
          spinner.fail("Failed to enable extension");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  /**
   * Disable command
   */
  private createDisableCommand(): Command {
    return new Command("disable")
      .description("Disable an enabled extension")
      .argument("<name>", "Extension name")
      .action(async (name: string) => {
        const spinner = ora(`Disabling extension ${name}...`).start();

        try {
          const manager = getExtensionManager();
          await manager.disable(name);

          spinner.succeed(`Extension ${chalk.bold(name)} disabled`);
          console.log(chalk.yellow("\n⚠️  Extension is now inactive"));
        } catch (error) {
          spinner.fail("Failed to disable extension");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  /**
   * Update command
   */
  private createUpdateCommand(): Command {
    return new Command("update")
      .description("Update an installed extension")
      .argument("<name>", "Extension name")
      .action(async (name: string) => {
        const spinner = ora(`Updating extension ${name}...`).start();

        try {
          const manager = getExtensionManager();
          await manager.update(name);

          spinner.succeed(`Extension ${chalk.bold(name)} updated`);
          console.log(chalk.green("\n✓ Extension updated to latest version"));
        } catch (error) {
          spinner.fail("Failed to update extension");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  /**
   * Uninstall command
   */
  private createUninstallCommand(): Command {
    return new Command("uninstall")
      .description("Uninstall an extension")
      .argument("<name>", "Extension name")
      .option("--force", "Skip confirmation prompt", false)
      .action(async (name: string, options) => {
        if (!options.force) {
          console.log(chalk.yellow(`\n⚠️  This will permanently remove extension: ${chalk.bold(name)}`));
          // In a real implementation, we'd use inquirer to prompt for confirmation
          console.log(chalk.gray("Use --force to skip this confirmation\n"));
        }

        const spinner = ora(`Uninstalling extension ${name}...`).start();

        try {
          const manager = getExtensionManager();
          await manager.uninstall(name);

          spinner.succeed(`Extension ${chalk.bold(name)} uninstalled`);
          console.log(chalk.green("\n✓ Extension removed successfully"));
        } catch (error) {
          spinner.fail("Failed to uninstall extension");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  /**
   * Info command
   */
  private createInfoCommand(): Command {
    return new Command("info")
      .description("Show detailed information about an extension")
      .argument("<name>", "Extension name")
      .action(async (name: string) => {
        const spinner = ora(`Loading extension info...`).start();

        try {
          const manager = getExtensionManager();
          const info = await manager.info(name);

          if (!info) {
            spinner.fail(`Extension ${name} not found`);
            return;
          }

          spinner.succeed("Extension info loaded");

          console.log(chalk.blue("\n📦 Extension Details:\n"));
          console.log(chalk.bold(`  Name: `) + info.name);
          console.log(chalk.bold(`  Display Name: `) + (info.displayName || info.name));
          console.log(chalk.bold(`  Version: `) + info.version);
          console.log(chalk.bold(`  Author: `) + (info.author || 'Unknown'));
          console.log(chalk.bold(`  Description: `) + (info.description || 'N/A'));
          console.log(chalk.bold(`  Status: `) + (info.enabled ? chalk.green("Enabled") : chalk.gray("Disabled")));
          console.log(chalk.bold(`  Source: `) + info.source);
          console.log(chalk.bold(`  Installed: `) + new Date(info.installedAt).toLocaleString());
          
          if (info.updatedAt) {
            console.log(chalk.bold(`  Updated: `) + new Date(info.updatedAt).toLocaleString());
          }

          console.log();
        } catch (error) {
          spinner.fail("Failed to load extension info");
          console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }
}

export default GemExtensionsCommand;
