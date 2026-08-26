import os

import hydra


@hydra.main(config_path="./conf", config_name="config", version_base=None)
def main(cfg):
    print(os.getcwd())


if __name__ == "__main__":
    main()
